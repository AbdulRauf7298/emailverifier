"""Tests for email verification endpoints and logic."""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


@pytest.fixture
def mock_verify_email():
    """Mock the verify_email function to avoid real network calls."""
    with patch("app.routers.verification.verify_email") as mock:
        mock.return_value = {
            "email": "test@gmail.com",
            "is_valid_syntax": True,
            "has_mx_records": True,
            "is_smtp_valid": True,
            "is_disposable": False,
            "is_role_based": False,
            "is_catch_all": False,
            "deliverability_score": 95.0,
            "status": "valid",
            "suggested_correction": None,
        }
        yield mock


async def test_verify_single_email(client: AsyncClient, auth_headers, mock_verify_email):
    """Test single email verification."""
    response = await client.post(
        "/api/verify/single",
        json={"email": "test@gmail.com"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@gmail.com"
    assert data["status"] == "valid"
    assert data["deliverability_score"] == 95.0
    assert data["is_valid_syntax"] is True


async def test_verify_single_insufficient_credits(client: AsyncClient, db_session, auth_headers):
    """Test that verification fails when user has no credits."""
    from sqlalchemy import select
    from app.models.user import User

    # Set user credits to 0
    result = await db_session.execute(select(User).where(User.email == "testuser@example.com"))
    user = result.scalar_one_or_none()
    if user:
        user.credits = 0
        await db_session.commit()

    response = await client.post(
        "/api/verify/single",
        json={"email": "test@gmail.com"},
        headers=auth_headers,
    )
    assert response.status_code == 402


async def test_get_verification_history(client: AsyncClient, auth_headers, mock_verify_email):
    """Test fetching verification history."""
    # First verify an email
    await client.post(
        "/api/verify/single",
        json={"email": "history@gmail.com"},
        headers=auth_headers,
    )

    response = await client.get("/api/verify/history", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_verify_syntax_validation():
    """Test email syntax validation logic directly."""
    from app.services.email_verifier import validate_syntax

    assert validate_syntax("valid@example.com") == (True, None)
    assert validate_syntax("invalid-email")[0] is False
    assert validate_syntax("no@domain")[0] is False
    assert validate_syntax("gmial.com@test.com")[0] is True  # syntax is valid; typo detection only applies to the domain part


async def test_disposable_detection():
    """Test disposable domain detection."""
    from app.utils.disposable_domains import is_disposable
    assert is_disposable("mailinator.com") is True
    assert is_disposable("gmail.com") is False
    assert is_disposable("yopmail.com") is True


async def test_role_based_detection():
    """Test role-based email detection."""
    from app.utils.disposable_domains import is_role_based
    assert is_role_based("admin") is True
    assert is_role_based("support") is True
    assert is_role_based("john") is False


async def test_deliverability_score():
    """Test deliverability score calculation."""
    from app.services.email_verifier import calculate_deliverability_score

    # Perfect email
    score = calculate_deliverability_score(True, True, True, False, False, False)
    assert score == 100.0

    # Invalid syntax
    score = calculate_deliverability_score(False, True, True, False, False, False)
    assert score == 0.0

    # Disposable email
    score = calculate_deliverability_score(True, True, True, True, False, False)
    assert score == 70.0

    # No MX records
    score = calculate_deliverability_score(True, False, None, False, False, None)
    assert score == 0.0


async def test_determine_status():
    """Test status determination logic."""
    from app.services.email_verifier import determine_status

    assert determine_status(True, True, True, False, 100.0) == "valid"
    assert determine_status(False, True, True, False, 0.0) == "invalid"
    assert determine_status(True, False, None, False, 0.0) == "invalid"
    assert determine_status(True, True, True, True, 70.0) == "risky"
