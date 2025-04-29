from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv(".env", override=True)

class Settings(BaseSettings):
    database_hostname: str
    database_port: int
    database_password: str
    database_name: str
    database_username: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = False

settings = Settings()