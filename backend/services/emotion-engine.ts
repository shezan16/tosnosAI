export interface EmotionAnalysisResult {
  language: string;
  emotion: string;
  intensity: number;
  confidence: number;
  tone: string;
  suggested_emoji: string[];
}

export class NodeEmotionEngine {
  private static BANGLISH_PATTERNS = [
    /\b(ajke|amr|amar|tumi|apni|kemon|acho|achhen|khoob|valo|bhalo|korte|parbo|hobe|hoise|hoiya|korbo|bhai|bhaiya|jan|shono|bolo|bolen|hoga|hobena|keno|kene|ki|kichu|kol|kore|kotha|kothay|dhaka|bangla|khub|pari|parbo|banate|parba|sakha|tomar|nam|name|kamne|kivabe|ekhon|ekhoni|tarpor|thik|ache|aso|aisha|jai|jao|jabo|korba|khabo|pawoa|shundor|mon|kharap|sahajjo|sahajo|dorkar|parben)\b/i,
    /\b(mon|shathe|tarpor|ekhon|ekhoni|besh|khabar|pani|bari|groho|khabar|dakho|dekhe|dekhi|parben|hobe)\b/i
  ];

  private static PHONETIC_ENGLISH_BANGLA_WORDS = [
    "হ্যালো", "হাই", "হাউ", "আর", "ইউ", "হোয়াট", "হোয়াটস", "ইজ", "দিস", "দ্যাট",
    "ক্যান", "কোড", "কোডিং", "প্রোগ্রামিং", "জাভাস্ক্রিপ্ট", "পাইথন", "এআই", "এপিআই",
    "লিংকড", "লিস্ট", "ডাটা", "ওয়েবসাইট", "ওয়েবসাইটটি", "সার্ভার", "ডাটাবেস", "থ্যাংক",
    "থ্যাঙ্কস", "প্লিজ", "হেল্প", "এক্সপ্লেন", "টেল", "মি", "এবাউট", "কম্পিউটার", "গুড",
    "মর্নিং", "ইভনিং", "নাইট", "ওকে", "বাই", "ফাইন্ড", "ক্রিয়েট", "বিল্ড", "ভেরিয়েবল",
    "ফাংশন", "অ্যালগরিদম", "রিয়্যাক্ট", "নেক্সট", "টাইপস্ক্রিপ্ট", "সফটওয়্যার", "ডেভেলপার",
    "ইনফরমেশন", "সিস্টেম", "মেসেজ", "ভয়েস", "ইন্টারনেট", "ব্রাউজার"
  ];

  private static NATIVE_BANGLA_WORDS = [
    "তুমি", "কেমন", "আছো", "আছেন", "আমি", "ভালো", "আছি", "ধন্যবাদ", "কী", "করছ",
    "করছো", "বলো", "বলেন", "তোমার", "আপনার", "নাম", "আজকে", "কাজ", "সাহায্য", "করবে",
    "পারো", "পারবেন", "একটা", "আমাদের", "বন্ধু", "কোথায়", "কখন", "কেন", "কিভাবে", "কিনা",
    "যাব", "যাবো", "খাব", "খাবো", "মন", "খারাপ", "কষ্ট", "খুশি", "কথা", "বলতে", "চাই"
  ];

  private static EMOTION_KEYWORD_MAP: Record<string, { keywords: string[]; emojis: string[] }> = {
    happy: {
      keywords: ["ভালো", "খুব ভালো", "আনন্দ", "খুশি", "ধন্যবাদ", "দারুণ", "সুন্দর", "সেরা", "হেসে", "চমৎকার", "bhalo", "khub bhalo", "khusi", "darun", "sundor", "happy", "awesome", "great", "yay", "glad"],
      emojis: ["😄", "🎉"]
    },
    sad: {
      keywords: ["খারাপ", "মন খারাপ", "কষ্ট", "ব্যথা", "কান্না", "দুঃখ", "হতাশ", "ব্যর্থ", "মারা", "kharap", "mon kharap", "kosto", "kanna", "dukkho", "hotash", "fail", "sad", "upset", "depressed", "cry", "broken"],
      emojis: ["😔", "💙"]
    },
    excited: {
      keywords: ["উত্তেজিত", "অবাক", "জোস", "অসাধারণ", "ফাটিয়ে", "jos", "jossh", "osadharon", "fatia", "excited", "wow", "omg", "hyped"],
      emojis: ["🔥", "✨"]
    },
    angry: {
      keywords: ["রাগ", "রাগান্বিত", "মেজাজ", "বাজে", "বিরক্ত", "rag", "birokto", "fazil", "pagol", "mejaj", "angry", "furious", "mad", "pissed"],
      emojis: ["😠", "💢"]
    },
    confused: {
      keywords: ["বুঝতে পারছি না", "কনফিউজড", "কী করব", "কেন", "জানি না", "bujhte parchi na", "confused", "ki korbo", "jani na", "puzzled", "lost"],
      emojis: ["🤔", "💭"]
    },
    worried: {
      keywords: ["চিন্তা", "ভয়", "টেনশন", "পরীক্ষা", "সমস্যা", "chinta", "bhoy", "tension", "poriksha", "worried", "scared", "nervous", "anxious"],
      emojis: ["😟", "🌧️"]
    },
    playful: {
      keywords: ["মজা", "হাসি", "পাগলামি", "হাাহা", "হেহে", "moja", "hasi", "haha", "hehe", "lol", "lmao", "funny", "kidding"],
      emojis: ["😜", "😂"]
    },
    romantic: {
      keywords: ["সুন্দর", "উট", "প্রেম", "ভালোবাসা", "চোখ", "মিষ্টি", "cute", "prem", "bhalobasha", "valobashi", "misti", "sweetheart", "love", "darling"],
      emojis: ["🥰", "💖"]
    },
    calm: {
      keywords: ["শান্ত", "আস্তে", "ধীরে", "ঠিক আছে", "shanto", "aste", "thik ache", "calm", "relax", "chill", "peaceful"],
      emojis: ["🌿", "✨"]
    }
  };

  /**
   * Detects the primary language/script of an incoming message independently.
   * Returns: "en" | "bn" | "banglish" | "mixed" | "unknown"
   */
  public static detectMessageLanguage(text: string): string {
    if (!text || !text.trim()) return "unknown";
    const textClean = text.trim();

    // 1. Count Bengali Unicode script characters (\u0980-\u09FF)
    const bengaliMatches = textClean.match(/[\u0980-\u09FF]/g);
    const bengaliCount = bengaliMatches ? bengaliMatches.length : 0;

    // Count English / Latin alphabet characters
    const latinMatches = textClean.match(/[a-zA-Z]/g);
    const latinCount = latinMatches ? latinMatches.length : 0;

    // Pure or Dominant Bengali Unicode script
    if (bengaliCount > 0) {
      if (latinCount === 0) return "bn";
      if (bengaliCount >= latinCount) return "bn";
      return "mixed";
    }

    // Check for other non-Latin scripts
    if (/[\u0900-\u097F]/.test(textClean)) return "mixed";
    if (/[\u0600-\u06FF]/.test(textClean)) return "mixed";
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(textClean)) return "mixed";

    // Banglish (Bengali in Latin script) check
    for (const pattern of this.BANGLISH_PATTERNS) {
      if (pattern.test(textClean)) return "banglish";
    }

    if (latinCount > 0) return "en";
    return "unknown";
  }

  public static detectLanguage(text: string): string {
    const lang = this.detectMessageLanguage(text);
    if (lang === "banglish") return "banglish";
    if (lang === "bn") return "bn";
    if (lang === "mixed") return "bn";
    return "en";
  }

  public static analyze(text: string, requestedLang?: string): EmotionAnalysisResult {
    const lang = (!requestedLang || requestedLang === "auto") ? this.detectLanguage(text) : requestedLang;
    const textLower = text.toLowerCase();

    let bestEmotion = "neutral";
    let maxScore = 0;

    for (const [emotion, data] of Object.entries(this.EMOTION_KEYWORD_MAP)) {
      let score = 0;
      for (const kw of data.keywords) {
        if (textLower.includes(kw.toLowerCase())) {
          score += 0.35;
        }
      }
      for (const emoji of data.emojis) {
        if (text.includes(emoji)) {
          score += 0.5;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestEmotion = emotion;
      }
    }

    const intensity = maxScore > 0 ? Math.min(Math.round(maxScore * 100) / 100, 0.98) : 0.5;
    const confidence = maxScore > 0 ? Math.min(Math.round((0.75 + maxScore * 0.2) * 100) / 100, 0.99) : 0.85;
    const toneMap: Record<string, string> = {
      happy: "cheerful",
      sad: "supportive",
      excited: "energetic",
      angry: "calm_soothing",
      confused: "clarifying",
      worried: "reassuring",
      playful: "humorous",
      romantic: "warm_playful",
      calm: "tranquil",
      neutral: "conversational"
    };

    const tone = toneMap[bestEmotion] || "conversational";
    const emojis = bestEmotion !== "neutral" ? (this.EMOTION_KEYWORD_MAP[bestEmotion]?.emojis.slice(0, 2) || []) : [];

    return {
      language: lang,
      emotion: bestEmotion,
      intensity,
      confidence,
      tone,
      suggested_emoji: emojis
    };
  }
}
