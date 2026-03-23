from __future__ import annotations

import json
from time import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse, unquote
from urllib.request import Request, urlopen

from app.core.config import get_settings

_PROFILE_BUCKET = "wolistic-media-profile"
_SIGNED_URL_CACHE_SECONDS = 600
_signed_url_cache: dict[str, tuple[float, str]] = {}


def normalize_profile_media_path(value: str | None) -> str | None:
    if value is None:
        return None

    raw = value.strip()
    if not raw:
        return None

    if raw.startswith("http://") or raw.startswith("https://"):
        parsed = urlparse(raw)
        path = unquote(parsed.path or "")
        for prefix in (
            f"/storage/v1/object/public/{_PROFILE_BUCKET}/",
            f"/storage/v1/object/sign/{_PROFILE_BUCKET}/",
            f"/storage/v1/object/{_PROFILE_BUCKET}/",
        ):
            if path.startswith(prefix):
                return path[len(prefix) :].lstrip("/") or None
        return raw

    normalized = raw.lstrip("/")
    for prefix in (
        f"storage/v1/object/public/{_PROFILE_BUCKET}/",
        f"storage/v1/object/sign/{_PROFILE_BUCKET}/",
        f"storage/v1/object/{_PROFILE_BUCKET}/",
    ):
        if normalized.startswith(prefix):
            return normalized[len(prefix) :].lstrip("/") or None

    return normalized


def to_public_profile_media_url(stored_value: str | None) -> str | None:
    if stored_value is None:
        return None

    raw = stored_value.strip()
    if not raw:
        return None

    if raw.startswith("http://") or raw.startswith("https://"):
        return raw

    settings = get_settings()
    base_url = str(settings.SUPABASE_URL).rstrip("/")
    normalized_path = raw.lstrip("/")

    signed_url = _get_cached_signed_profile_media_url(
        base_url=base_url,
        object_path=normalized_path,
        service_role_key=settings.SUPABASE_SERVICE_ROLE_KEY,
        expires_in=settings.SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS,
    )
    if signed_url:
        return signed_url

    encoded_path = quote(normalized_path, safe="/")
    return f"{base_url}/storage/v1/object/public/{_PROFILE_BUCKET}/{encoded_path}"


def _get_cached_signed_profile_media_url(
    *,
    base_url: str,
    object_path: str,
    service_role_key: str,
    expires_in: int,
) -> str | None:
    key = f"{base_url}|{object_path}|{expires_in}"
    now = time()
    cached = _signed_url_cache.get(key)
    if cached and cached[0] > now:
        return cached[1]

    signed_url = _to_signed_profile_media_url(
        base_url=base_url,
        object_path=object_path,
        service_role_key=service_role_key,
        expires_in=expires_in,
    )
    if not signed_url:
        return None

    _signed_url_cache[key] = (now + _SIGNED_URL_CACHE_SECONDS, signed_url)
    return signed_url


def _to_signed_profile_media_url(
    *,
    base_url: str,
    object_path: str,
    service_role_key: str,
    expires_in: int,
) -> str | None:
    key = service_role_key.strip()
    if not key:
        return None

    encoded_path = quote(object_path, safe="/")
    endpoint = f"{base_url}/storage/v1/object/sign/{_PROFILE_BUCKET}/{encoded_path}"
    payload = json.dumps({"expiresIn": expires_in}).encode("utf-8")

    request = Request(
        endpoint,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
        },
    )

    try:
        with urlopen(request, timeout=3) as response:
            body = response.read().decode("utf-8")
            parsed = json.loads(body)
    except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError):
        return None

    signed_path = parsed.get("signedURL")
    if not isinstance(signed_path, str) or not signed_path:
        return None

    if signed_path.startswith("http://") or signed_path.startswith("https://"):
        return signed_path

    normalized_signed_path = signed_path if signed_path.startswith("/") else f"/{signed_path}"
    if not normalized_signed_path.startswith("/storage/v1/"):
        normalized_signed_path = f"/storage/v1{normalized_signed_path}"
    return f"{base_url}{normalized_signed_path}"
