from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.emotion_routes import router as emotion_router

app = FastAPI(
    title="TosnosAI Emotion Engine Service",
    description="Multilingual emotion and conversational tone analysis service for TosnosAI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emotion_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TosnosAI Emotion Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
