from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError

from app.core.config import get_settings

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: uuid.UUID
    email: str | None = None
    role: str | None = None


def _supabase_issuer() -> str:
    return f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1"


def _supabase_jwks_url() -> str:
    return f"{_supabase_issuer()}/.well-known/jwks.json"


@lru_cache
def get_jwk_client() -> PyJWKClient:
    return PyJWKClient(_supabase_jwks_url())


def _fetch_user_from_supabase(token: str) -> dict[str, Any]:
    if not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Supabase auth configuration",
        )

    request = Request(
        url=f"{_supabase_issuer()}/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_ANON_KEY,
        },
    )

    try:
        with urlopen(request, timeout=5) as response:
            payload = response.read().decode("utf-8")
    except (HTTPError, URLError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        ) from exc

    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication response",
        ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication payload",
        )

    return data


def _decode_token(token: str) -> dict[str, Any]:
    try:
        signing_key = get_jwk_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            issuer=_supabase_issuer(),
            options={"verify_aud": False},
        )
    except (InvalidTokenError, PyJWKClientError):
        return _fetch_user_from_supabase(token)


def _resolve_current_user(token: str) -> AuthenticatedUser:
    payload = _decode_token(token)
    raw_user_id = payload.get("sub") or payload.get("id")

    if not isinstance(raw_user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identifier in authentication token",
        )

    try:
        user_id = uuid.UUID(raw_user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in authentication token",
        ) from exc

    email = payload.get("email") if isinstance(payload.get("email"), str) else None
    role = payload.get("role") if isinstance(payload.get("role"), str) else None

    return AuthenticatedUser(user_id=user_id, email=email, role=role)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
        )

    return _resolve_current_user(credentials.credentials)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedUser | None:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        return None

    return _resolve_current_user(credentials.credentials)