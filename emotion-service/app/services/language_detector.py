import re

class LanguageDetector:
    """
    Multilingual Language & Script Detector for TosnosAI.
    Detects Bengali Unicode, Banglish (Bengali transliterated in Latin alphabet),
    English, Hindi, Arabic, Spanish, French, German, Japanese, Chinese, and Mixed scripts.
    """

    BENGALI_RANGE = re.compile(r'[\u0980-\u09FF]')
    DEVANAGARI_RANGE = re.compile(r'[\u0900-\u097F]')
    ARABIC_RANGE = re.compile(r'[\u0600-\u06FF]')
    JAPANESE_RANGE = re.compile(r'[\u3040-\u30FF\u4E00-\u9FFF]')
    CHINESE_RANGE = re.compile(r'[\u4E00-\u9FFF]')

    # Key Banglish marker vocabulary and character patterns
    BANGLISH_PATTERNS = [
        r'\b(ajke|amr|amar|tumi|apni|kemon|acho|achhen|khoob|valo|bhalo|korte|parbo|hobe|hoise|hoiya|korbo|bhai|bhaiya|jan|shono|bolo|bolen|hoga|hobena|keno|kene|ki|kichu|kol|kore|kotha|kothay|dhaka|bangla|khub|pari|parbo)\b',
        r'\b(mon|shathe|tarpor|ekhon|ekhoni|besh|khabar|pani|bari|groho|khabar|dakho|dekhe|dekhi)\b'
    ]

    def detect(self, text: str) -> str:
        if not text or not text.strip():
            return "en"

        text_clean = text.strip()
        lower_text = text_clean.lower()

        bengali_chars = len(self.BENGALI_RANGE.findall(text_clean))
        total_chars = len(re.sub(r'\s+', '', text_clean)) or 1

        if bengali_chars / total_chars > 0.3:
            # Check if there is significant Latin text mixed in
            latin_chars = len(re.findall(r'[a-zA-Z]', text_clean))
            if latin_chars > 3:
                return "mixed"
            return "bn"

        if self.DEVANAGARI_RANGE.search(text_clean):
            return "hi"

        if self.ARABIC_RANGE.search(text_clean):
            return "ar"

        if self.JAPANESE_RANGE.search(text_clean):
            return "ja"

        if self.CHINESE_RANGE.search(text_clean):
            return "zh"

        # Check for Banglish (Latin script Bengali)
        for pattern in self.BANGLISH_PATTERNS:
            if re.search(pattern, lower_text, re.IGNORECASE):
                return "banglish"

        # Check for European languages markers
        if re.search(r'[áéíóúñ¿¡]', lower_text):
            return "es"
        if re.search(r'[éèêëàâùûçœæ]', lower_text):
            return "fr"
        if re.search(r'[äöüß]', lower_text):
            return "de"

        return "en"
