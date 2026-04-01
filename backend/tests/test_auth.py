"""Tests for authentication endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_user(client: AsyncClient):
    """Test user registration."""
    response = await client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepassword123",
        "full_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["credits"] == 10  # default credits
    assert "id" in data
    assert "api_key" in data


async def test_register_duplicate_email(client: AsyncClient, registered_user):
    """Test that duplicate email registration is rejected."""
    response = await client.post("/api/auth/register", json={
        "email": "testuser@example.com",
        "password": "anotherpassword123",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


async def test_login_success(client: AsyncClient, registered_user):
    """Test successful login."""
    response = await client.post(
        "/api/auth/login",
        data={"username": "testuser@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data


async def test_login_wrong_password(client: AsyncClient, registered_user):
    """Test login with wrong password."""
    response = await client.post(
        "/api/auth/login",
        data={"username": "testuser@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_get_me(client: AsyncClient, auth_headers):
    """Test getting current user profile."""
    response = await client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"


async def test_get_me_unauthenticated(client: AsyncClient):
    """Test that unauthenticated access is rejected."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


async def test_regenerate_api_key(client: AsyncClient, auth_headers, registered_user):
    """Test API key regeneration."""
    old_key = registered_user["api_key"]
    response = await client.post("/api/auth/regenerate-api-key", headers=auth_headers)
    assert response.status_code == 200
    new_key = response.json()["api_key"]
    assert new_key != old_key
