"""
Auth API: Google OAuth and JWT.
"""

import os
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

# Scopes for Google OAuth (openid, email, profile)
GOOGLE_SCOPES = "openid email profile"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = 7


def _get_redirect_uri() -> str:
    base = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
    return f"{base}/auth/google/callback"


def _create_jwt(user: User) -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET environment variable is required")
    payload = {
        "sub": str(user.id),
        "email": user.email,
    }
    return jwt.encode(
        payload,
        secret,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    """Dependency: require valid JWT and return User. Use on protected routes."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="Server auth not configured")
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/google")
async def auth_google():
    """Redirect to Google OAuth consent screen."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not set")
    redirect_uri = _get_redirect_uri()
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def auth_google_callback(code: str | None = None, db: Session = Depends(get_db)):
    """Exchange code for tokens, fetch userinfo, create/update user, redirect to frontend with JWT."""
    if not code:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}?auth_error=missing_code")

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    redirect_uri = _get_redirect_uri()

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if token_resp.status_code != 200:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}?auth_error=token_exchange_failed")

    data = token_resp.json()
    access_token = data.get("access_token")
    if not access_token:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}?auth_error=no_token")

    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if userinfo_resp.status_code != 200:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}?auth_error=userinfo_failed")

    info = userinfo_resp.json()
    google_id = info.get("id")
    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")
    if not google_id or not email:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}?auth_error=missing_profile")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(google_id=google_id, email=email, name=name, picture=picture)
        db.add(user)
    else:
        user.email = email
        user.name = name
        user.picture = picture
    db.commit()
    db.refresh(user)

    try:
        token = _create_jwt(user)
    except ValueError:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}?auth_error=server_config")

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return RedirectResponse(url=f"{frontend_url}?token={token}")


@router.get("/me")
def auth_me(user: User = Depends(get_current_user)):
    """Return current user from JWT. Frontend calls this with Authorization header."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
    }
