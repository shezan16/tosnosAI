export type DetectedLanguage = "en" | "bn" | "banglish" | "mixed" | "unknown";

export class LanguageDetector {
  private static BANGLISH_PATTERNS = [
    /\b(ajke|amr|amar|tumi|apni|kemon|acho|achhen|khoob|valo|bhalo|korte|parbo|hobe|hoise|hoiya|korbo|bhai|bhaiya|jan|shono|bolo|bolen|hoga|hobena|keno|kene|ki|kichu|kol|kore|kotha|kothay|dhaka|bangla|khub|pari|parbo|banate|parba|sakha|tomar|nam|name|kamne|kivabe|ekhon|ekhoni|tarpor|thik|ache|aso|aisha|jai|jao|jabo|korba|khabo|pawoa|shundor|mon|kharap|sahajjo|sahajo|dorkar|parben|korsen|korcho|korco|apnar|dada|dhonnobad|dhanyabad|khabor|khobor|kee|kobe|bolte|chao|parbi|hawa|howa|dekhi|dakho|jani|janena|aaj|valobashi)\b/i,
    /\b(mon|shathe|tarpor|ekhon|ekhoni|besh|khabar|pani|bari|groho|khabar|dakho|dekhe|dekhi|parben|hobe|amader|oder|tader|coder|kaj|kajer)\b/i
  ];

  /**
   * Detects the primary language/script of an incoming user message independently.
   * Returns: "en" | "bn" | "banglish" | "mixed" | "unknown"
   */
  public static detectMessageLanguage(text: string): DetectedLanguage {
    if (!text || !text.trim()) return "unknown";
    const textClean = text.trim();

    // 1. Count Bengali Unicode script characters (\u0980-\u09FF)
    const bengaliMatches = textClean.match(/[\u0980-\u09FF]/g);
    const bengaliCount = bengaliMatches ? bengaliMatches.length : 0;

    // Count English / Latin alphabet characters
    const latinMatches = textClean.match(/[a-zA-Z]/g);
    const latinCount = latinMatches ? latinMatches.length : 0;

    // 1a. Pure or Dominant Bengali Unicode script
    if (bengaliCount > 0) {
      if (latinCount === 0) {
        return "bn";
      }
      if (bengaliCount >= latinCount) {
        return "bn";
      }
      return "mixed";
    }

    // 2. Check for other non-Latin scripts (Hindi, Arabic, Japanese, etc.)
    if (/[\u0900-\u097F]/.test(textClean)) return "mixed";
    if (/[\u0600-\u06FF]/.test(textClean)) return "mixed";
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(textClean)) return "mixed";

    // 3. Banglish (Bengali in Latin script) check
    for (const pattern of this.BANGLISH_PATTERNS) {
      if (pattern.test(textClean)) return "banglish";
    }

    // 4. Default to English for Latin script
    if (latinCount > 0) {
      return "en";
    }

    return "unknown";
  }

  /**
   * Backward-compatible language detection wrapper returning standard language code strings
   */
  public static detectLanguage(text: string): string {
    const lang = this.detectMessageLanguage(text);
    if (lang === "banglish") return "banglish";
    if (lang === "bn") return "bn";
    if (lang === "mixed") return "bn";
    if (lang === "en") return "en";
    return "en";
  }
}

