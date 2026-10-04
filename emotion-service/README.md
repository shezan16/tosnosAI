# TosnosAI Emotion & Language Intelligence Service

FastAPI microservice providing real-time multilingual emotion detection, emotion intensity calculation, conversational tone analysis, and response style recommendations for **TosnosAI**.

---

## 🌟 Features
- **Multilingual Support**: Bengali (`bn`), English (`en`), Banglish (`banglish`), and Mixed Bengali-English (`bn-en`).
- **19 Emotion Categories**: `neutral`, `happy`, `sad`, `excited`, `angry`, `confused`, `worried`, `surprised`, `calm`, `playful`, `affectionate`, `romantic`, `frustrated`, `curious`, `grateful`, `disappointed`, `hopeful`, `bored`, `tired`.
- **Confidence Filtering**: Returns `emotion: "uncertain"` when confidence is below `EMOTION_CONFIDENCE_THRESHOLD` (default: 0.55).
- **Semantic Intensity & Tone Analysis**: Computes intensity (0.0 to 1.0) and assigns appropriate conversational tone.
- **Emoji Recommendation**: Recommends 1-3 contextual emojis without forcing them.
- **XLM-RoBERTa Model Integration**: PyTorch + Hugging Face Transformers with CUDA/CPU auto-detection and fallback execution.
- **Training Pipeline**: Fine-tune custom emotion models on CSV, JSON, or JSONL datasets.

---

## 🚀 Quick Start Commands

### 1. Setup Virtual Environment
```bash
cd emotion-service
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Service
```bash
uvicorn app.main:app --reload --port 8001
```
The service will be live at `http://localhost:8001`.

---

## 📡 API Endpoints

### 1. Analyze Emotion & Language
`POST /analyze`

**Request:**
```json
{
  "text": "ajke amar project finally complete hoise 🔥🔥"
}
```

**Response:**
```json
{
  "language": "banglish",
  "language_confidence": 0.97,
  "emotion": "excited",
  "secondary_emotion": "happy",
  "emotion_intensity": 0.94,
  "emotion_confidence": 0.92,
  "tone": "enthusiastic",
  "suggested_emojis": ["🤩", "🔥", "🎉"],
  "response_style": "energetic and enthusiastic"
}
```

### 2. Health Check
`GET /health`

### 3. Model Metadata
`GET /model-info`

---

## 🏋️ Model Training & Evaluation

### Train Custom XLM-RoBERTa Model
```bash
python training/train.py --data data/emotions.csv --epochs 5 --batch_size 8
```

### Evaluate Model Accuracy & F1
```bash
python training/evaluate.py --data data/emotions.csv
```

### Run Unit Tests
```bash
python -m unittest tests/test_api.py
```
