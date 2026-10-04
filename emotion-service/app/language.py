import re
from typing import Dict, Any

class LanguageDetector:
    # Common Banglish words and patterns (Latin script Bengali)
    BANGLISH_KEYWORDS = {
        "amar", "tamar", "tomar", "amader", "kemon", "acho", "achi", "khobor",
        "ki", "kono", "valo", "bhalo", "khap", "kharaf", "kharap", "koro", "korbo",
        "hoise", "hoeyese", "hobe", "kori", "korte", "hoye", "jesi", "gesi",
        "ekhon", "ajke", "aj", "kal", "kalke", "shob", "sob", "shono", "bolce",
        "bolse", "dada", "bhai", "bro", "mon", "moner", "bhalobasha", "bhalobasa",
        "dorkar", "chai", "parba", "pari", "janalem", "bollam", "dekho", "dekhi",
        "lagche", "lagse", "bujhlams", "bujhi", "bujhte", "shomossha", "problem"
    }

    @classmethod
    def detect(cls, text: str) -> Dict[str, Any]:
        text_clean = (text or "").strip()
        if not text_clean:
            return {"language": "en", "language_confidence": 1.0}

        words = re.findall(r'\b\w+\b', text_clean.lower())
        total_words = len(words) if words else 1

        # Check Unicode Bengali characters
        bengali_chars = len(re.findall(r'[\u0980-\u09FF]', text_clean))
        total_chars = max(len(text_clean), 1)
        bengali_ratio = bengali_chars / total_chars

        # Check Banglish words
        banglish_word_count = sum(1 for w in words if w in cls.BANGLISH_KEYWORDS)
        banglish_ratio = banglish_word_count / total_words

        # Check English words
        english_words = sum(1 for w in words if re.match(r'^[a-z]+$', w) and w not in cls.BANGLISH_KEYWORDS)
        english_ratio = english_words / total_words

        # Classification Logic
        if bengali_ratio > 0.25:
            # Check if there are significant English words mixed in
            if english_ratio > 0.2:
                return {"language": "bn-en", "language_confidence": round(min(0.85 + bengali_ratio, 0.98), 2)}
            return {"language": "bn", "language_confidence": round(min(0.88 + bengali_ratio, 0.99), 2)}

        if banglish_ratio > 0.15 or (banglish_word_count >= 1 and english_ratio > 0.2):
            if english_ratio > 0.35 and banglish_word_count >= 1:
                return {"language": "bn-en", "language_confidence": round(min(0.82 + banglish_ratio, 0.96), 2)}
            return {"language": "banglish", "language_confidence": round(min(0.85 + banglish_ratio, 0.97), 2)}

        if re.search(r'[\u0980-\u09FF]', text_clean):
            return {"language": "bn", "language_confidence": 0.90}

        return {"language": "en", "language_confidence": round(min(0.85 + english_ratio * 0.1, 0.98), 2)}
