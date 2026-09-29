from pydantic import BaseModel, Field
from typing import List, Optional

class EmotionRequest(BaseModel):
    text: str = Field(..., description="User input text to analyze")
    language: Optional[str] = Field("auto", description="Language code or auto")
    audio_features: Optional[dict] = Field(None, description="Optional acoustic audio features")

class EmotionResponse(BaseModel):
    language: str = Field(..., description="Detected language code (bn, en, banglish, etc.)")
    emotion: str = Field(..., description="Primary detected emotion category")
    intensity: float = Field(..., description="Emotion intensity score from 0.0 to 1.0")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    tone: str = Field(..., description="Conversational tone descriptive string")
    suggested_emoji: List[str] = Field(..., description="Suggested emoji representations (0-2 max)")
