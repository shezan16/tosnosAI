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
    /\b(ajke|amr|amar|tumi|apni|kemon|acho|achhen|khoob|valo|bhalo|korte|parbo|hobe|hoise|hoiya|korbo|bhai|bhaiya|jan|shono|bolo|bolen|hoga|hobena|keno|kene|ki|kichu|kol|kore|kotha|kothay|dhaka|bangla|khub|pari|parbo)\b/i,
    /\b(mon|shathe|tarpor|ekhon|ekhoni|besh|khabar|pani|bari|groho|khabar|dakho|dekhe|dekhi)\b/i
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

  public static detectLanguage(text: string): string {
    if (!text || !text.trim()) return "en";
    const textClean = text.trim();
    const bengaliChars = (textClean.match(/[\u0980-\u09FF]/g) || []).length;
    const totalChars = textClean.replace(/\s+/g, "").length || 1;

    if (bengaliChars / totalChars > 0.3) {
      const latinCount = (textClean.match(/[a-zA-Z]/g) || []).length;
      return latinCount > 3 ? "mixed" : "bn";
    }

    if (/[\u0900-\u097F]/.test(textClean)) return "hi";
    if (/[\u0600-\u06FF]/.test(textClean)) return "ar";
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(textClean)) return "ja";
    if (/[\u4E00-\u9FFF]/.test(textClean)) return "zh";

    for (const pattern of this.BANGLISH_PATTERNS) {
      if (pattern.test(textClean)) return "banglish";
    }

    if (/[áéíóúñ¿¡]/i.test(textClean)) return "es";
    if (/[éèêëàâùûçœæ]/i.test(textClean)) return "fr";
    if (/[äöüß]/i.test(textClean)) return "de";

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
