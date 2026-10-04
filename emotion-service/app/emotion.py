import re
from typing import Dict, Any, Tuple

class IntensityCalculator:
    @classmethod
    def calculate(cls, text: str, emotion: str) -> float:
        text_clean = text or ""
        base_intensity = 0.65 if emotion not in ("neutral", "uncertain") else 0.20

        # Emotional keyword indicators
        high_intensity_words = {
            "really", "extremely", "so", "very", "super", "omg", "wow", "finally",
            "khub", "onek", "sotty", "shotti", "darun", "pagal", "chera", "brooo",
            "broooo", "yesss", "nooo", "hate", "love", "worst", "best", "amazing",
            "awesome", "terrible", "horrible", "complete", "hoise"
        }

        words = re.findall(r'\b\w+\b', text_clean.lower())
        word_count = len(words)
        match_count = sum(1 for w in words if w in high_intensity_words)

        if match_count > 0:
            base_intensity += min(match_count * 0.12, 0.25)

        # Exclamation marks & caps
        exclamations = text_clean.count('!')
        if exclamations > 0:
            base_intensity += min(exclamations * 0.08, 0.20)

        caps_words = sum(1 for w in text_clean.split() if w.isupper() and len(w) > 1)
        if caps_words > 0:
            base_intensity += min(caps_words * 0.10, 0.20)

        # Emoji intensity
        high_intensity_emojis = set("🔥🔥🎉🤩😭😡💖😍😱🤯💥😄😊")
        emoji_count = sum(1 for char in text_clean if char in high_intensity_emojis)
        if emoji_count > 0:
            base_intensity += min(emoji_count * 0.12, 0.25)

        # Short neutral sentences
        if emotion == "neutral" and word_count < 5 and exclamations == 0:
            base_intensity = 0.15

        return round(max(0.05, min(base_intensity, 0.98)), 2)
