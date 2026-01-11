"""
Application Configuration
Loads settings from environment variables with defaults
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


def is_serverless() -> bool:
    """Detect if running in serverless environment (Vercel, AWS Lambda, etc.)"""
    return (
        os.getenv("VERCEL") == "1" or
        os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None or
        os.getenv("RENDER") is not None or
        os.getenv("RAILWAY_ENVIRONMENT") is not None
    )


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application Settings
    app_name: str = "Student Analytics API"
    app_version: str = "2.0.0"
    app_env: str = os.getenv("APP_ENV", "production" if is_serverless() else "development")
    debug: bool = not is_serverless()
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))
    
    # CORS Settings - Allow specific Vercel domains
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
        # Add your specific Vercel domains here
        "https://dropout-dashboard.vercel.app",
        "https://dropout-dashboard-*.vercel.app",  # Preview deployments
    ]
    
    # File Upload Settings
    max_upload_size_mb: int = 10
    allowed_file_extensions: List[str] = [".csv", ".xlsx"]
    
    # Serverless-aware directory paths
    @property
    def upload_dir(self) -> Path:
        if is_serverless():
            return Path("/tmp/uploads")
        return Path("./uploads")
    
    @property
    def temp_dir(self) -> Path:
        if is_serverless():
            return Path("/tmp")
        return Path("./temp")
    
    @property
    def log_file(self) -> Path:
        if is_serverless():
            return Path("/tmp/app.log")
        return Path("./logs/app.log")
    
    # Model Settings
    model_dir: Path = Path("./public/models")
    model_cache_enabled: bool = True
    
    # Logging Settings
    log_level: str = "INFO"
    log_max_size_mb: int = 10
    log_backup_count: int = 5
    
    # Security Settings
    api_key_required: bool = False
    api_key: str = ""
    rate_limit_per_minute: int = 60
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist (with error handling for read-only filesystems) (with error handling for read-only filesystems)
        try:
            self.upload_dir.mkdir(parents=True, exist_ok=True)
            self.temp_dir.mkdir(parents=True, exist_ok=True)
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
        except (OSError, PermissionError) as e:
            # In serverless, /tmp is auto-created, other paths may be read-only
            if not is_serverless():
                raise e
            # In serverless, silently continue if directory creation fails


# Global settings instance
settings = Settings()
