"use client";

export type VoiceGender = "auto" | "female" | "male";

export interface VoiceSelectionOptions {
  gender: VoiceGender;
  lang: string; // "bn-BD" | "en-US" | "auto"
}

export interface VoiceSearchResult {
  voice: SpeechSynthesisVoice | null;
  targetLang: string;
  isBangla: boolean;
  hasNativeVoice: boolean;
}

export class VoiceMatcher {
  private static STORAGE_KEY = "tosnosai_voice_preference";
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static isInitialized = false;

  /**
   * Initializes voice list cache and binds onvoiceschanged listener
   */
  public static initVoices(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.cachedVoices = window.speechSynthesis.getVoices() || [];
    if (!this.isInitialized) {
      this.isInitialized = true;
      try {
        window.speechSynthesis.onvoiceschanged = () => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            this.cachedVoices = window.speechSynthesis.getVoices() || [];
          }
        };
      } catch (e) {
        console.warn("Could not attach onvoiceschanged listener:", e);
      }
    }
  }

  /**
   * Retrieves saved voice preference from localStorage
   */
  public static getSavedGenderPreference(): VoiceGender {
    if (typeof window === "undefined") return "auto";
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === "female" || saved === "male" || saved === "auto") {
        return saved;
      }
    } catch (e) {
      console.warn("Could not read voice preference from localStorage:", e);
    }
    return "auto";
  }

  /**
   * Saves voice preference to localStorage
   */
  public static saveGenderPreference(gender: VoiceGender): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.STORAGE_KEY, gender);
    } catch (e) {
      console.warn("Could not save voice preference to localStorage:", e);
    }
  }

  /**
   * Retrieves all available Web Speech Synthesis voices dynamically
   */
  public static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return [];
    }
    this.initVoices();
    const liveVoices = window.speechSynthesis.getVoices();
    if (liveVoices && liveVoices.length > 0) {
      this.cachedVoices = liveVoices;
      return liveVoices;
    }
    return this.cachedVoices;
  }

  /**
   * Finds best matching SpeechSynthesisVoice based on language and gender preference
   */
  public static findBestVoice(
    text: string,
    gender: VoiceGender = "auto",
    requestedLang: string = "auto"
  ): VoiceSearchResult {
    const voices = this.getAvailableVoices();
    
    // Determine language from content or requested option
    const isBangla = /[\u0980-\u09FF]/.test(text) || requestedLang === "bn-BD" || requestedLang === "bn" || requestedLang === "banglish";
    const targetLang = isBangla ? "bn-BD" : "en-US";

    if (!voices || voices.length === 0) {
      return { voice: null, targetLang, isBangla, hasNativeVoice: false };
    }

    // 1. Filter by language code and locale names
    const langVoices = voices.filter((v) => {
      const vLang = (v.lang || "").toLowerCase();
      const nameLower = v.name.toLowerCase();
      if (isBangla) {
        return (
          vLang.includes("bn") ||
          vLang.includes("bd") ||
          (vLang.includes("in") && (nameLower.includes("bengali") || nameLower.includes("bangla"))) ||
          nameLower.includes("bangla") ||
          nameLower.includes("bengali") ||
          nameLower.includes("bn-bd") ||
          nameLower.includes("bn-in")
        );
      } else {
        return vLang.includes("en");
      }
    });

    const hasNativeVoice = isBangla ? langVoices.length > 0 : voices.some(v => (v.lang || "").toLowerCase().includes("en"));
    const candidatePool = langVoices.length > 0 ? langVoices : voices;

    if (candidatePool.length === 0) {
      return { voice: null, targetLang, isBangla, hasNativeVoice: false };
    }

    if (gender === "auto") {
      return { voice: candidatePool[0] || null, targetLang, isBangla, hasNativeVoice };
    }

    // 2. Filter by Gender keywords in voice metadata & name
    const femaleKeywords = ["female", "woman", "girl", "zira", "jenny", "samantha", "victoria", "karen", "aria", "hazel", "nabanita", "bangla female"];
    const maleKeywords = ["male", "man", "boy", "david", "guy", "mark", "george", "james", "bashkar", "bangla male"];
    const genderKeywords = gender === "female" ? femaleKeywords : maleKeywords;

    const genderMatch = candidatePool.find((v) => {
      const nameLower = v.name.toLowerCase();
      return genderKeywords.some((kw) => nameLower.includes(kw));
    });

    if (genderMatch) {
      return { voice: genderMatch, targetLang, isBangla, hasNativeVoice };
    }

    // Fallback: return first candidate in target language pool
    return { voice: candidatePool[0] || null, targetLang, isBangla, hasNativeVoice };
  }

  /**
   * Speaks sample preview text for voice testing with full debug logging
   */
  public static previewVoice(gender: VoiceGender, isBangla: boolean = false): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Clear speech queue

    const text = isBangla ? "হ্যালো! আমি TosnosAI।" : "Hello! I am TosnosAI.";
    const { voice, targetLang } = this.findBestVoice(text, gender, isBangla ? "bn-BD" : "en-US");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    if (voice) {
      utterance.voice = voice;
    }

    utterance.pitch = gender === "female" ? 1.15 : gender === "male" ? 0.90 : 1.0;
    utterance.rate = 1.0;

    console.log("[TTS] Response:", text);
    console.log("[TTS] Available voices:", this.getAvailableVoices());
    console.log("[TTS] Selected voice:", voice);
    console.log("[TTS] Language:", utterance.lang);
    console.log("[TTS] Starting speech");

    utterance.onstart = () => console.log("[TTS] Started");
    utterance.onend = () => console.log("[TTS] Finished");
    utterance.onerror = (e) => console.error("[TTS] Error:", e);

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Cleans and sanitizes text for SpeechSynthesisUtterance.
   * Strips code blocks, URLs, Unicode emojis, markdown.
   */
  public static sanitizeTextForSpeech(text: string): string {
    if (!text) return "";

    let cleaned = text;
    cleaned = cleaned.replace(/```[\s\S]*?```/g, " ");
    cleaned = cleaned.replace(/https?:\/\/\S+/gi, "");
    cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2B50}\u{2B55}]/gu, "");
    cleaned = cleaned.replace(/[*_~`#|>]/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  /**
   * Splits a long text response into small, natural speech chunks (sentences/clauses).
   */
  public static splitTextIntoSpeechChunks(text: string, maxChunkLen: number = 170): string[] {
    if (!text || !text.trim()) return [];

    const sanitized = this.sanitizeTextForSpeech(text);
    if (!sanitized) return [];

    const rawSentences = sanitized.split(/(?<=[।॥.!?;\n])\s+/);
    const finalChunks: string[] = [];

    for (const rawSentence of rawSentences) {
      const trimmed = rawSentence.trim();
      if (!trimmed) continue;

      if (trimmed.length <= maxChunkLen) {
        finalChunks.push(trimmed);
      } else {
        const clauses = trimmed.split(/(?<=[,،\-–])\s+/);
        let currentChunk = "";

        for (const clause of clauses) {
          const trimmedClause = clause.trim();
          if (!trimmedClause) continue;

          if ((currentChunk + " " + trimmedClause).trim().length <= maxChunkLen) {
            currentChunk = (currentChunk + " " + trimmedClause).trim();
          } else {
            if (currentChunk) {
              finalChunks.push(currentChunk);
              currentChunk = "";
            }

            if (trimmedClause.length <= maxChunkLen) {
              currentChunk = trimmedClause;
            } else {
              const words = trimmedClause.split(/\s+/);
              let wordBuffer = "";
              for (const word of words) {
                if ((wordBuffer + " " + word).trim().length <= maxChunkLen) {
                  wordBuffer = (wordBuffer + " " + word).trim();
                } else {
                  if (wordBuffer) finalChunks.push(wordBuffer);
                  wordBuffer = word;
                }
              }
              if (wordBuffer) {
                currentChunk = wordBuffer;
              }
            }
          }
        }
        if (currentChunk) {
          finalChunks.push(currentChunk);
        }
      }
    }

    return finalChunks.filter((c) => c.trim().length > 0);
  }
}
