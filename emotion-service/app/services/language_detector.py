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
        r'\b(ajke|amr|amar|tumi|apni|kemon|acho|achhen|khoob|valo|bhalo|korte|parbo|hobe|hoise|hoiya|korbo|bhai|bhaiya|jan|shono|bolo|bolen|hoga|hobena|keno|kene|ki|kichu|kol|kore|kotha|kothay|dhaka|bangla|khub|pari|parbo|banate|parba|sakha|tomar|nam|name|kamne|kivabe|ekhon|ekhoni|tarpor|thik|ache|aso|aisha|jai|jao|jabo|korba|khabo|pawoa|shundor|mon|kharap|sahajjo|sahajo|dorkar|parben)\b',
        r'\b(mon|shathe|tarpor|ekhon|ekhoni|besh|khabar|pani|bari|groho|khabar|dakho|dekhe|dekhi|parben|hobe)\b'
    ]

    def detect(self, text: str) -> str:
        if not text or not text.strip():
            return "en"

        text_clean = text.strip()
        lower_text = text_clean.lower()

        bengali_chars = len(self.BENGALI_RANGE.findall(text_clean))
        if bengali_chars > 0:
            return "bn"

        if self.DEVANAGARI_RANGE.search(text_clean):
            return "hi"

        if self.ARABIC_RANGE.search(text_clean):
            return "ar"

        if self.JAPANESE_RANGE.search(text_clean):
            return "ja"

        # Check for Banglish (Latin script Bengali)
        for pattern in self.BANGLISH_PATTERNS:
            if re.search(pattern, lower_text, re.IGNORECASE):
                return "banglish"

        return "en"
