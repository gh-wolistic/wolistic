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

    # NoDecode avoids JSON-only parsing so comma-separated env values work.
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
