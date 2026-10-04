import sys
import os
import unittest

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.inference import EmotionInferenceEngine

class TestEmotionAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = EmotionInferenceEngine.get_instance()

    def test_case_1_bengali_happy(self):
        text = "আজকে আমার অনেক ভালো লাগছে 😄"
        res = self.engine.predict(text)
        self.assertIn(res["language"], ["bn", "bn-en"])
        self.assertEqual(res["emotion"], "happy")
        self.assertGreaterEqual(res["emotion_intensity"], 0.70)

    def test_case_2_english_sad(self):
        text = "I am really sad today."
        res = self.engine.predict(text)
        self.assertEqual(res["language"], "en")
        self.assertEqual(res["emotion"], "sad")

    def test_case_3_banglish_excited(self):
        text = "ajke amar project finally complete hoise 🔥"
        res = self.engine.predict(text)
        self.assertIn(res["language"], ["banglish", "bn-en"])
        self.assertEqual(res["emotion"], "excited")
        self.assertGreaterEqual(res["emotion_intensity"], 0.85)

    def test_case_4_banglish_confused(self):
        text = "bro ami confused hoye gesi"
        res = self.engine.predict(text)
        self.assertIn(res["language"], ["banglish", "bn-en"])
        self.assertEqual(res["emotion"], "confused")

    def test_case_5_bengali_sad(self):
        text = "আজকে মনটা খুব খারাপ।"
        res = self.engine.predict(text)
        self.assertEqual(res["language"], "bn")
        self.assertEqual(res["emotion"], "sad")

    def test_case_6_mixed_surprised(self):
        text = "OMG! তুমি এটা সত্যিই করেছো!"
        res = self.engine.predict(text)
        self.assertIn(res["emotion"], ["surprised", "happy"])

    def test_case_7_bengali_confused(self):
        text = "আমি জানি না কী করব"
        res = self.engine.predict(text)
        self.assertEqual(res["language"], "bn")
        self.assertIn(res["emotion"], ["confused", "worried"])

if __name__ == "__main__":
    unittest.main()
