from fastapi import APIRouter, HTTPException
from app.schemas.emotion_schemas import EmotionRequest, EmotionResponse
from app.services.language_detector import LanguageDetector
from app.services.emotion_analyzer import EmotionAnalyzer

router = APIRouter()
lang_detector = LanguageDetector()
emotion_analyzer = EmotionAnalyzer()

@router.post("/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion(req: EmotionRequest):
    try:
        # Detect language if set to auto or empty
        if not req.language or req.language == "auto":
            detected_lang = lang_detector.detect(req.text)
        else:
            detected_lang = req.language

        # Perform emotion analysis
        result = emotion_analyzer.analyze(req.text, detected_lang)

        return EmotionResponse(
            language=result["language"],
            emotion=result["emotion"],
            intensity=result["intensity"],
            confidence=result["confidence"],
            tone=result["tone"],
            suggested_emoji=result["suggested_emoji"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis error: {str(e)}")
