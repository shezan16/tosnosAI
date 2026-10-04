import os
import re
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

from typing import Dict, Any, List, Optional, Tuple
from app.config import config
from app.language import LanguageDetector
from app.emotion import IntensityCalculator
from app.response_style import ResponseStyleEngine, SUPPORTED_EMOTIONS

class EmotionInferenceEngine:
    _instance = None
    model_loaded = False
    device = "cuda" if (TORCH_AVAILABLE and torch.cuda.is_available()) else "cpu"

    def __init__(self):
        self.model_name = config.EMOTION_MODEL_NAME
        self.threshold = config.EMOTION_CONFIDENCE_THRESHOLD
        self.pipeline = None
        self._initialize_model()

    def _initialize_model(self):
        try:
            from transformers import pipeline
            print(f"[TosnosAI Emotion AI] Initializing Transformer pipeline with model: {self.model_name} on device: {self.device}...")
            # We attempt to load XLM-RoBERTa / HuggingFace Pipeline
            device_id = 0 if self.device == "cuda" else -1
            self.pipeline = pipeline(
                "text-classification",
                model=self.model_name,
                return_all_scores=True,
                device=device_id
            )
            self.model_loaded = True
            print("[TosnosAI Emotion AI] Transformer model successfully loaded!")
        except Exception as e:
            print(f"[TosnosAI Emotion AI] Transformer load notice (using multilingual semantic fallback engine): {e}")
            self.model_loaded = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = EmotionInferenceEngine()
        return cls._instance

    def predict(self, text: str, context: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        text_clean = (text or "").strip()
        if not text_clean:
            return self._build_result("neutral", 0.90, "bn", 1.0, 0.10, text_clean)

        # 1. Language Detection (Banglish, Bengali, English, Mixed)
        lang_res = LanguageDetector.detect(text_clean)
        lang = lang_res["language"]
        lang_conf = lang_res["language_confidence"]

        # 2. Emotion Inference via Model / Multilingual Semantic Classification
        raw_emotion, raw_conf, secondary_emotion = self._classify_emotion(text_clean, context)

        # 3. Apply Confidence Threshold Filter
        final_emotion = raw_emotion
        if raw_conf < self.threshold:
            final_emotion = "uncertain"

        # 4. Intensity Calculation
        intensity = IntensityCalculator.calculate(text_clean, final_emotion)

        # 5. Response Style & Emoji Recommendation
        style_info = ResponseStyleEngine.get_style(final_emotion)

        return {
            "language": lang,
            "language_confidence": lang_conf,
            "emotion": final_emotion,
            "secondary_emotion": secondary_emotion,
            "emotion_intensity": intensity,
            "emotion_confidence": round(raw_conf, 2),
            "tone": style_info["tone"],
            "suggested_emojis": style_info["emojis"],
            "response_style": style_info["response_style"]
        }

    def _classify_emotion(self, text: str, context: Optional[List[Dict[str, str]]] = None) -> Tuple[str, float, Optional[str]]:
        text_lower = text.lower()

        # If PyTorch pipeline is active, run model inference
        if self.model_loaded and self.pipeline:
            try:
                outputs = self.pipeline(text[:512])
                if outputs and len(outputs) > 0:
                    scores = outputs[0]
                    sorted_scores = sorted(scores, key=lambda x: x['score'], reverse=True)
                    top_label = sorted_scores[0]['label'].lower()
                    top_score = float(sorted_scores[0]['score'])
                    mapped_emotion = self._map_label_to_emotion(top_label)
                    return mapped_emotion, top_score, None
            except Exception as err:
                print(f"Pipeline inference notice: {err}")

        # Multilingual Rule-Augmented Classifier Engine (Bangla, Banglish, English)
        return self._rule_augmented_predict(text_lower, context)

    def _rule_augmented_predict(self, text: str, context: Optional[List[Dict[str, str]]] = None) -> Tuple[str, float, Optional[str]]:
        # Check Excited
        if any(w in text for w in ["complete hoise", "finally", "yesss", "omg", "wow", "darun", "pagal", "🔥", "🎉", "🤩"]):
            if any(w in text for w in ["complete", "finally", "did it", "hoise", "জিতছি", "পাইছি"]):
                return "excited", 0.94, "happy"

        # Check Happy
        if any(w in text for w in ["valo lagche", "bhalo lagche", "bhalo", "valo", "happy", "great", "awesome", "khushi", "আনন্দ", "ভালো"]):
            return "happy", 0.91, None

        # Check Sad
        if any(w in text for w in ["mon kharap", "mon khap", "sad", "bad day", "khoop kharap", "খারাপ", "কষ্ট", "দুঃখ", "মন খারাপ", "😭", "😔"]):
            return "sad", 0.92, None

        # Check Confused
        if any(w in text for w in ["confused", "bujhte parsi na", "ki korbo", "bujhi na", "bujhlams na", "কী করব", "বুঝতে পারছি না", "🤔"]):
            return "confused", 0.88, "worried"

        # Check Worried
        if any(w in text for w in ["scared", "fear", "worried", "exam tomorrow", "haven't studied", "vabchilam", "ভয়", "চিন্তা", "intense"]):
            return "worried", 0.89, "frustrated"

        # Check Surprised
        if any(w in text for w in ["really", "sotty", "shotti", "করেছো", "সত্যি", "unbelievable", "🤯", "😮"]):
            return "surprised", 0.86, "happy"

        # Check Angry / Frustrated
        if any(w in text for w in ["angry", "rag", "rag lagse", "annoyed", "frustrated", "faltu", "রাগ", "বিরক্ত"]):
            return "angry", 0.87, "frustrated"

        # Context-Aware Checks (e.g. recent message about exam + haven't studied)
        if context and len(context) > 0:
            past_text = " ".join([m.get("content", "").lower() for m in context[-3:]])
            if "exam" in past_text or "test" in past_text or "pariksha" in past_text:
                if any(w in text for w in ["haven't", "ni", "scared", "fear", "voy"]):
                    return "worried", 0.88, "frustrated"

        # Default Neutral
        return "neutral", 0.85, None

    def _map_label_to_emotion(self, label: str) -> str:
        label_clean = label.replace("label_", "").strip()
        for emotion in SUPPORTED_EMOTIONS:
            if emotion in label_clean:
                return emotion
        if "pos" in label_clean or "joy" in label_clean:
            return "happy"
        if "neg" in label_clean or "sad" in label_clean:
            return "sad"
        return "neutral"

    def _build_result(self, emotion: str, conf: float, lang: str, lang_conf: float, intensity: float, text: str) -> Dict[str, Any]:
        style_info = ResponseStyleEngine.get_style(emotion)
        return {
            "language": lang,
            "language_confidence": lang_conf,
            "emotion": emotion,
            "secondary_emotion": None,
            "emotion_intensity": intensity,
            "emotion_confidence": conf,
            "tone": style_info["tone"],
            "suggested_emojis": style_info["emojis"],
            "response_style": style_info["response_style"]
        }
