from functools import lru_cache
from typing import Annotated, List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

    APP_NAME: str = "backend"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str
    SUPABASE_URL: AnyHttpUrl
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS: int = 86400
    PAYMENT_PROVIDER: str = "razorpay"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    FEATURED_INDEX_REFRESH_SECONDS: int = 900
    PROFILE_COMPLETENESS_MIN_FOR_DISCOVERY: int = 50
    SLOW_SQL_LOGGING_ENABLED: bool = True
    SLOW_SQL_THRESHOLD_MS: int = 120
    ADMIN_API_KEY: str = ""

    # NoDecode avoids JSON-only parsing so comma-separated env values work.
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("PAYMENT_PROVIDER")
    @classmethod
    def validate_payment_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized != "razorpay":
            raise ValueError("PAYMENT_PROVIDER must be 'razorpay'")
        return normalized

    @field_validator("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET")
    @classmethod
    def strip_payment_secret_values(cls, value: str) -> str:
        return value.strip()

    @field_validator("ADMIN_API_KEY")
    @classmethod
    def strip_admin_api_key(cls, value: str) -> str:
        return value.strip()

    @field_validator("SUPABASE_SERVICE_ROLE_KEY")
    @classmethod
    def strip_supabase_service_role_key(cls, value: str) -> str:
        return value.strip()

    @field_validator("SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS")
    @classmethod
    def validate_signed_url_ttl(cls, value: int) -> int:
        if value < 60:
            raise ValueError("SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS must be >= 60")
        return value

    @field_validator("PROFILE_COMPLETENESS_MIN_FOR_DISCOVERY")
    @classmethod
    def validate_profile_completeness_threshold(cls, value: int) -> int:
        if value < 0 or value > 100:
            raise ValueError("PROFILE_COMPLETENESS_MIN_FOR_DISCOVERY must be between 0 and 100")
        return value

    @field_validator("SLOW_SQL_THRESHOLD_MS")
    @classmethod
    def validate_slow_sql_threshold(cls, value: int) -> int:
        if value < 1:
            raise ValueError("SLOW_SQL_THRESHOLD_MS must be >= 1")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
