from typing import Dict, List, Any

SUPPORTED_EMOTIONS = [
    "neutral", "happy", "sad", "excited", "angry", 
    "confused", "worried", "surprised", "calm", "playful", 
    "affectionate", "romantic", "frustrated", "curious", "grateful", 
    "disappointed", "hopeful", "bored", "tired"
]

EMOTION_STYLE_MAP: Dict[str, Dict[str, Any]] = {
    "happy": {
        "response_style": "cheerful and friendly",
        "tone": "cheerful",
        "emojis": ["😊", "😄", "🎉"]
    },
    "sad": {
        "response_style": "gentle and supportive",
        "tone": "empathetic",
        "emojis": ["😔", "💙"]
    },
    "excited": {
        "response_style": "energetic and enthusiastic",
        "tone": "enthusiastic",
        "emojis": ["🤩", "🔥", "🎉"]
    },
    "angry": {
        "response_style": "calm, patient, and respectful",
        "tone": "calm",
        "emojis": ["😌", "🤝"]
    },
    "confused": {
        "response_style": "patient and explanatory",
        "tone": "patient",
        "emojis": ["🤔", "💡"]
    },
    "worried": {
        "response_style": "reassuring and calm",
        "tone": "reassuring",
        "emojis": ["🤗", "💙"]
    },
    "surprised": {
        "response_style": "expressive and attentive",
        "tone": "astonished",
        "emojis": ["😮", "🤯", "✨"]
    },
    "calm": {
        "response_style": "relaxed and thoughtful",
        "tone": "serene",
        "emojis": ["🌱", "✨"]
    },
    "playful": {
        "response_style": "humorous, witty, and casual",
        "tone": "playful",
        "emojis": ["😂", "😏", "😜"]
    },
    "affectionate": {
        "response_style": "warm, caring, and attentive",
        "tone": "warm",
        "emojis": ["🥰", "💖", "🤗"]
    },
    "romantic": {
        "response_style": "warm, sweet, and respectful",
        "tone": "affectionate",
        "emojis": ["🥰", "❤️", "✨"]
    },
    "frustrated": {
        "response_style": "patient and solution-focused",
        "tone": "constructive",
        "emojis": ["💪", "🧩"]
    },
    "curious": {
        "response_style": "engaging, informative, and inquisitive",
        "tone": "curious",
        "emojis": ["🧐", "✨", "🔍"]
    },
    "grateful": {
        "response_style": "warm, appreciative, and humble",
        "tone": "thankful",
        "emojis": ["🙏", "✨", "😊"]
    },
    "disappointed": {
        "response_style": "understanding, comforting, and encouraging",
        "tone": "understanding",
        "emojis": ["🌧️", "💙"]
    },
    "hopeful": {
        "response_style": "optimistic, inspiring, and uplifting",
        "tone": "encouraging",
        "emojis": ["🌈", "🌟", "✨"]
    },
    "bored": {
        "response_style": "lively, interesting, and engaging",
        "tone": "sprightly",
        "emojis": ["⚡", "🎨", "🎮"]
    },
    "tired": {
        "response_style": "gentle, soothing, and concise",
        "tone": "soft",
        "emojis": ["🌙", "☕", "😴"]
    },
    "neutral": {
        "response_style": "balanced, helpful, and clear",
        "tone": "natural",
        "emojis": ["👍", "😊"]
    },
    "uncertain": {
        "response_style": "attentive, adaptive, and balanced",
        "tone": "neutral",
        "emojis": ["😊"]
    }
}

class ResponseStyleEngine:
    @classmethod
    def get_style(cls, emotion: str) -> Dict[str, Any]:
        emotion_key = emotion.lower()
        if emotion_key not in EMOTION_STYLE_MAP:
            emotion_key = "neutral"
        return EMOTION_STYLE_MAP[emotion_key]
