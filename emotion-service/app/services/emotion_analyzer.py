import re
from typing import Dict, Any, List

class EmotionAnalyzer:
    """
    Modular Emotion Analyzer Service for TosnosAI.
    Analyzes emotional tone, intensity, confidence, and returns 0-2 contextual emojis.
    Designed with an extensible interface so deep learning transformer models can be attached.
    """

    EMOTION_KEYWORDS = {
        "happy": {
            "bn": ["ভালো", "খুব ভালো", "আনন্দ", "খুশি", "ধন্যবাদ", "দারুণ", "সুন্দর", "সেরা", "হেসে", "চমৎকার"],
            "banglish": ["bhalo", "khub bhalo", "khusi", "khushi", "darun", "sundor", "sera", "awesome", "great", "happy", "yey"],
            "en": ["happy", "great", "awesome", "wonderful", "love", "good", "fantastic", "yay", "cheerful", "glad", "delighted"],
            "emojis": ["😄", "🎉"]
        },
        "sad": {
            "bn": ["খারাপ", "মন খারাপ", "কষ্ট", "ব্যথা", "কান্না", "দুঃখ", "হতাশ", "ব্যর্থ", "মারা", "হারিয়ে"],
            "banglish": ["kharap", "mon kharap", "kosto", "kanna", "dukkho", "hotash", "byartho", "fail", "sad", "upset"],
            "en": ["sad", "depressed", "unhappy", "cry", "crying", "broken", "failed", "miserable", "lonely", "hurt", "grief"],
            "emojis": ["😔", "💙"]
        },
        "excited": {
            "bn": ["উত্তেজিত", "অবাক", "জোস", "অসাধারণ", "ফাটিয়ে", "নতুন"],
            "banglish": ["jos", "jossh", "osadharon", "fatia", "excited", "wow", "omg", "lets go"],
            "en": ["excited", "amazing", "omg", "hyped", "thrilled", "unbelievable", "woah", "pumped"],
            "emojis": ["🔥", "✨"]
        },
        "angry": {
            "bn": ["রাগ", "রাগান্বিত", "মেজাজ", "বাজে", "বিরক্ত", "ফাজিল", "পাগল"],
            "banglish": ["rag", "raging", "birokto", "fazil", "pagol", "mejaj", "angry", "furious"],
            "en": ["angry", "furious", "mad", "hate", "annoyed", "pissed", "irritated", "rage"],
            "emojis": ["😠", "💢"]
        },
        "confused": {
            "bn": ["বুঝতে পারছি না", "কনফিউজড", "কী করব", "কেন", "জানি না", "জটিল"],
            "banglish": ["bujhte parchi na", "confused", "ki korbo", "jani na", "keno", "ki vabe"],
            "en": ["confused", "puzzled", "don't understand", "what do you mean", "huh", "unclear", "lost"],
            "emojis": ["🤔", "💭"]
        },
        "worried": {
            "bn": ["চিন্তা", "ভয়", "টেনশন", "পরীক্ষা", "সমস্যা", "বিপদ"],
            "banglish": ["chinta", "bhoy", "tension", "poriksha", "somossa", "worried", "scared", "nervous"],
            "en": ["worried", "anxious", "scared", "nervous", "afraid", "stress", "stressed", "fear"],
            "emojis": ["😟", "🌧️"]
        },
        "surprised": {
            "bn": ["সত্যি", "অবাক", "বিশ্বাস হচ্ছে না", "হঠাৎ"],
            "banglish": ["sotyi", "obak", "surprised", "really", "ki bolo"],
            "en": ["surprised", "shocked", "really", "whoa", "unexpected", "seriously"],
            "emojis": ["😮", "❗"]
        },
        "playful": {
            "bn": ["মজা", "হাসি", "পাগলামি", "কৌতুক", "হাাহা", "হেহে"],
            "banglish": ["moja", "hasi", "haha", "hehe", "lol", "funny", "lmao", "rofl", "pagol"],
            "en": ["playful", "funny", "joke", "haha", "lmao", "lol", "kidding", "silly"],
            "emojis": ["😜", "😂"]
        },
        "romantic": {
            "bn": ["সুন্দর", "উট", "প্রেম", "ভালোবাসা", "চোখ", "মিষ্টি", "কাছে"],
            "banglish": ["cute", "prem", "bhalobasha", "valobashi", "misti", "aww", "sweetheart", "darling"],
            "en": ["cute", "love", "sweet", "romantic", "darling", "lovely", "adore", "heart"],
            "emojis": ["🥰", "💖"]
        },
        "affectionate": {
            "bn": ["লক্ষ্মী", "প্রিয়", "যত্ন", "বন্ধু", "পাশে"],
            "banglish": ["lokkhy", "priyo", "jotno", "bondu", "friend", "caring"],
            "en": ["affectionate", "caring", "warm", "friend", "kind", "dear"],
            "emojis": ["🤗", "🤍"]
        },
        "calm": {
            "bn": ["শান্ত", "আস্তে", "ধীরে", "ঠিক আছে", "স্বাভাবিক"],
            "banglish": ["shanto", "aste", "dhire", "thik ache", "calm", "relax"],
            "en": ["calm", "peaceful", "relaxed", "tranquil", "chill", "steady"],
            "emojis": ["🌿", "✨"]
        }
    }

    TONE_MAP = {
        "happy": "cheerful",
        "sad": "supportive",
        "excited": "energetic",
        "angry": "calm_soothing",
        "confused": "clarifying",
        "worried": "reassuring",
        "surprised": "expressive",
        "playful": "humorous",
        "romantic": "warm_playful",
        "affectionate": "gentle",
        "calm": "tranquil",
        "neutral": "conversational"
    }

    def __init__(self, external_model=None):
        self.external_model = external_model  # Placeholder for pluggable PyTorch/HuggingFace model

    def analyze(self, text: str, detected_lang: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "language": detected_lang,
                "emotion": "neutral",
                "intensity": 0.50,
                "confidence": 0.90,
                "tone": "conversational",
                "suggested_emoji": []
            }

        text_lower = text.lower()
        scores = {}

        # Rule & Lexicon scoring
        for emotion, data in self.EMOTION_KEYWORDS.items():
            score = 0.0
            lang_keys = data.get(detected_lang, []) + data.get("en", []) + data.get("banglish", [])
            for key in lang_keys:
                if key and key in text_lower:
                    score += 0.35
            
            # Emoji detection boost
            for emoji in data.get("emojis", []):
                if emoji in text:
                    score += 0.50

            if score > 0:
                scores[emotion] = min(score, 0.98)

        if not scores:
            detected_emotion = "neutral"
            intensity = 0.50
            confidence = 0.85
            tone = self.TONE_MAP["neutral"]
            emojis = []
        else:
            sorted_emotions = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            detected_emotion, intensity = sorted_emotions[0]
            confidence = round(min(0.70 + intensity * 0.25, 0.99), 2)
            intensity = round(intensity, 2)
            tone = self.TONE_MAP.get(detected_emotion, "conversational")
            emojis = self.EMOTION_KEYWORDS.get(detected_emotion, {}).get("emojis", [])[:2]

        return {
            "language": detected_lang,
            "emotion": detected_emotion,
            "intensity": intensity,
            "confidence": confidence,
            "tone": tone,
            "suggested_emoji": emojis
        }
