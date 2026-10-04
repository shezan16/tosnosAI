from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import config
from app.schemas import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    ModelInfoResponse, 
    ResponseStyleRequest, 
    ResponseStyleResponse
)
from app.inference import EmotionInferenceEngine
from app.response_style import ResponseStyleEngine, SUPPORTED_EMOTIONS

app = FastAPI(
    title="TosnosAI Emotion AI Service",
    description="Multilingual Emotion & Language Intelligence Service using PyTorch, XLM-RoBERTa & FastAPI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = EmotionInferenceEngine.get_instance()

@app.get("/", tags=["Status"])
def root():
    return {
        "service": "TosnosAI Emotion AI Service",
        "status": "online",
        "model": config.EMOTION_MODEL_NAME,
        "version": "TosnosEmotion-v1"
    }

@app.get("/health", tags=["Status"])
def health_check():
    return {
        "status": "ok",
        "device": engine.device,
        "model_loaded": engine.model_loaded,
        "confidence_threshold": config.EMOTION_CONFIDENCE_THRESHOLD
    }

@app.get("/model-info", response_model=ModelInfoResponse, tags=["Info"])
def get_model_info():
    return ModelInfoResponse(
        model=config.EMOTION_MODEL_NAME,
        version="TosnosEmotion-v1",
        languages=["bn", "en", "banglish", "bn-en"],
        supported_emotions=SUPPORTED_EMOTIONS,
        confidence_threshold=config.EMOTION_CONFIDENCE_THRESHOLD
    )

@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
def analyze_emotion(req: AnalyzeRequest):
    try:
        context_dicts = None
        if req.context:
            context_dicts = [{"role": c.role, "content": c.content} for c in req.context]
            
        result = engine.predict(req.text, context_dicts)
        return AnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")

@app.post("/response-style", response_model=ResponseStyleResponse, tags=["Style"])
def get_response_style(req: ResponseStyleRequest):
    style_info = ResponseStyleEngine.get_style(req.emotion)
    return ResponseStyleResponse(
        response_style=style_info["response_style"],
        tone=style_info["tone"],
        emojis=style_info["emojis"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=config.HOST, port=config.PORT, reload=config.DEBUG)
