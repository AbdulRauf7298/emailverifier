"""Tests for credit system and admin endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_get_credit_balance(client: AsyncClient, auth_headers):
    """Test getting current credit balance."""
    response = await client.get("/api/credits/balance", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "credits" in data
    assert isinstance(data["credits"], int)


async def test_get_credit_transactions(client: AsyncClient, auth_headers):
    """Test getting credit transaction history."""
    response = await client.get("/api/credits/transactions", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_admin_list_users(client: AsyncClient, superadmin_headers):
    """Test superadmin can list all users."""
    response = await client.get("/api/admin/users", headers=superadmin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_admin_adjust_credits_add(client: AsyncClient, superadmin_headers, registered_user):
    """Test superadmin can add credits to a user."""
    user_id = registered_user["id"]
    initial_credits = registered_user["credits"]

    response = await client.post(
        "/api/admin/credits/adjust",
        json={"user_id": user_id, "amount": 100, "reason": "Test credit add"},
        headers=superadmin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 100
    assert data["balance_after"] == initial_credits + 100


async def test_admin_adjust_credits_deduct(client: AsyncClient, superadmin_headers, registered_user, db_session):
    """Test superadmin can deduct credits from a user."""
    from sqlalchemy import select
    from app.models.user import User

    user_id = registered_user["id"]

    # Ensure user has enough credits
    result = await db_session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.credits = 50
        await db_session.commit()

    response = await client.post(
        "/api/admin/credits/adjust",
        json={"user_id": user_id, "amount": -20, "reason": "Test credit deduct"},
        headers=superadmin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == -20


async def test_admin_non_admin_rejected(client: AsyncClient, auth_headers):
    """Test that non-admin users cannot access admin endpoints."""
    response = await client.get("/api/admin/users", headers=auth_headers)
    assert response.status_code == 403


async def test_admin_get_stats(client: AsyncClient, superadmin_headers):
    """Test superadmin stats endpoint."""
    response = await client.get("/api/admin/stats", headers=superadmin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_verifications" in data
    assert "total_credits_outstanding" in data


async def test_admin_list_verifications(client: AsyncClient, superadmin_headers):
    """Test superadmin can view all verification logs."""
    response = await client.get("/api/admin/verifications", headers=superadmin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
