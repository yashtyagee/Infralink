import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    database_url = os.getenv("DATABASE_URL", "sqlite:///./entitynet.db")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    model_path = os.getenv("MODEL_PATH", "./data/models/siamese_model.h5")
    secret_key = os.getenv("SECRET_KEY", "default-secret-key-change-this")
    debug = os.getenv("DEBUG", "True").lower() == "true"

settings = Settings()