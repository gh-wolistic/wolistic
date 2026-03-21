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
    PAYMENT_PROVIDER: str = "mock"
    PAYMENT_MOCK_DEFAULT_STATUS: str = "success"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    FEATURED_INDEX_REFRESH_SECONDS: int = 900
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
        if normalized not in {"mock", "razorpay"}:
            raise ValueError("PAYMENT_PROVIDER must be either 'mock' or 'razorpay'")
        return normalized

    @field_validator("PAYMENT_MOCK_DEFAULT_STATUS")
    @classmethod
    def validate_payment_mock_default_status(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"success", "failure", "pending"}:
            raise ValueError(
                "PAYMENT_MOCK_DEFAULT_STATUS must be one of 'success', 'failure', or 'pending'"
            )
        return normalized

    @field_validator("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET")
    @classmethod
    def strip_payment_secret_values(cls, value: str) -> str:
        return value.strip()

    @field_validator("ADMIN_API_KEY")
    @classmethod
    def strip_admin_api_key(cls, value: str) -> str:
        return value.strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()
