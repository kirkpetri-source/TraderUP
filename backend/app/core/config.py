from functools import lru_cache
from pydantic import Field, AnyUrl
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "TraderUP Alerts API"
    api_v1_prefix: str = "/api/v1"
    broker_provider: str = Field("alpaca", description="Identificador do provedor padrão (alpaca|oanda).")
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])

    database_url: AnyUrl | None = None

    telegram_token: str | None = None
    telegram_chat_ids: List[str] = Field(default_factory=list)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
