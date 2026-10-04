from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class MessageContext(BaseModel):
    role: str
    content: str

class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="User message text to analyze")
    context: Optional[List[MessageContext]] = Field(default=None, description="Recent conversation context")

class AnalyzeResponse(BaseModel):
    language: str = Field(..., description="Detected language: bn, en, banglish, or bn-en")
    language_confidence: float = Field(..., description="Confidence of language detection between 0.0 and 1.0")
    emotion: str = Field(..., description="Primary detected emotion or 'uncertain'")
    secondary_emotion: Optional[str] = Field(default=None, description="Secondary context emotion if applicable")
    emotion_intensity: float = Field(..., description="Emotion intensity score between 0.0 and 1.0")
    emotion_confidence: float = Field(..., description="Confidence score of emotion prediction between 0.0 and 1.0")
    tone: str = Field(..., description="Conversational tone e.g. enthusiastic, gentle, patient")
    suggested_emojis: List[str] = Field(..., description="1-3 recommended emojis matching emotion and tone")
    response_style: str = Field(..., description="Recommended LLM response style e.g. energetic, supportive")

class ModelInfoResponse(BaseModel):
    model: str
    version: str
    languages: List[str]
    supported_emotions: List[str]
    confidence_threshold: float

class ResponseStyleRequest(BaseModel):
    emotion: str

class ResponseStyleResponse(BaseModel):
    response_style: str
    tone: str
    emojis: List[str]
