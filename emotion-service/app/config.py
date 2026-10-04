import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Config:
    EMOTION_MODEL_NAME: str = os.getenv("EMOTION_MODEL_NAME", "xlm-roberta-base")
    EMOTION_CONFIDENCE_THRESHOLD: float = float(os.getenv("EMOTION_CONFIDENCE_THRESHOLD", "0.55"))
    PORT: int = int(os.getenv("PORT", "8001"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

config = Config()
