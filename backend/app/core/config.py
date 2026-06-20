from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    MAX_IMAGE_SIZE_MB: int = 5
    RATE_LIMIT_PER_MINUTE: int = 30
    TEMP_FILE_TTL_SECONDS: int = 300

    @property
    def MAX_IMAGE_SIZE_BYTES(self) -> int:
        """Convert MB to bytes for upload validation."""
        return self.MAX_IMAGE_SIZE_MB * 1024 * 1024

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Cache settings instance for application lifetime."""
    return Settings()
