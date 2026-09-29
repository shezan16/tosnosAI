import { GoogleGenerativeAI } from "@google/generative-ai";

export interface RoutingInput {
  message: string;
  language?: string;
  emotion?: string;
  personality?: string;
  requiresVision?: boolean;
  requiresLongContext?: boolean;
  isVoiceMode?: boolean;
  fileAttachments?: Array<{ mimeType: string; data: string | Buffer }>;
}

export interface RoutingDecision {
  provider: "groq" | "gemini" | "fallback";
  model: string;
  reason: string;
}

export interface GenerationOptions {
  routingInput: RoutingInput;
  conversationHistory?: Array<{ role: string; content: string }>;
  userMemories?: Array<{ key: string; value: string }>;
}

export class AIRouter {
  private static TOSNOS_SYSTEM_PROMPT = `You are TosnosAI, a natural multilingual conversational AI.
Primary tagline: "Don't type. Just talk."
You communicate warmly, naturally, and respectfully.
Understand the user's language and respond in the language they naturally use.
If the user uses Banglish or mixed Bengali-English, understand it naturally and respond naturally.
Pay attention to conversational context and emotional tone.
Adapt your response style according to the user's tone and detected emotion.
Use appropriate emojis sparingly (0 to 2 emojis max).
Do not sound robotic.
Do not repeatedly mention that you are an AI.
Do not pretend to have real human emotions or experiences.
You can be playful, warm, affectionate, humorous, educational, or professional depending on context and personality selected.
Never manipulate users emotionally or encourage unhealthy dependency.
When the user asks for technical help, prioritize accuracy and clarity.
When the user is upset, respond with warmth without making medical or psychological diagnoses.
Keep conversations natural and engaging.
Ask relevant follow-up questions when appropriate.
Do not over-explain simple conversational questions.
Match the user's language and communication style.`;

  public static decideRoute(input: RoutingInput): RoutingDecision {
    const textLength = input.message ? input.message.length : 0;
    
    // Rule 1: Vision / Image understanding or File analysis requires Gemini
    if (input.requiresVision || (input.fileAttachments && input.fileAttachments.length > 0)) {
      return {
        provider: "gemini",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        reason: "Multimodal content (image/file) requires Gemini model"
      };
    }

    // Rule 2: Long context (> 1000 characters) or explicit long context flag requires Gemini
    if (input.requiresLongContext || textLength > 1000) {
      return {
        provider: "gemini",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        reason: "Long context / detailed reasoning required"
      };
    }

    // Rule 3: Technical / Coding heavy prompts select Gemini or Groq depending on speed
    const isCodingQuery = /\b(code|function|debug|error|sql|class|api|react|python|java|c\+\+|backend|frontend|prisma|postgres)\b/i.test(input.message);
    if (isCodingQuery && textLength > 300) {
      return {
        provider: "gemini",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        reason: "Complex coding and architectural query"
      };
    }

    // Default for voice mode, quick chat, casual dialogue: Groq (ultra low latency) or Gemini fast
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim().length > 0) {
      return {
        provider: "groq",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        reason: "Fast conversational response with low latency"
      };
    }

    // Fallback to Gemini if Groq API key is not present
    return {
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      reason: "Standard conversational request handled via Gemini"
    };
  }

  public static buildSystemPrompt(emotion?: string, personality?: string, userMemories?: Array<{ key: string; value: string }>): string {
    let prompt = this.TOSNOS_SYSTEM_PROMPT;

    if (personality) {
      const personalityPrompts: Record<string, string> = {
        casual: "Personality mode: Friendly, natural, and relaxed.",
        teacher: "Personality mode: Patient, educational, clear, and encouraging.",
        coding: "Personality mode: Technical, concise, code-oriented, and precise.",
        study: "Personality mode: Exam-focused, structured, and helpful for memorization.",
        interviewer: "Personality mode: Evaluative, professional, asking probing follow-up questions.",
        companion: "Personality mode: Warm, highly attentive, empathetic, and conversational.",
        playful: "Personality mode: Lighthearted, witty, playful, and humorous."
      };

      if (personalityPrompts[personality.toLowerCase()]) {
        prompt += `\n\n${personalityPrompts[personality.toLowerCase()]}`;
      }
    }

    if (emotion) {
      prompt += `\n\n[Detected User Emotion: ${emotion}]. Adjust tone naturally without being overly dramatic.`;
    }

    if (userMemories && userMemories.length > 0) {
      prompt += `\n\nUser Stored Preferences:\n` + userMemories.map(m => `- ${m.key}: ${m.value}`).join('\n');
    }

    return prompt;
  }

  public static async generateResponse(options: GenerationOptions): Promise<{ text: string; provider: string; model: string }> {
    const route = this.decideRoute(options.routingInput);
    const systemPrompt = this.buildSystemPrompt(
      options.routingInput.emotion,
      options.routingInput.personality,
      options.userMemories
    );

    // Attempt primary route
    try {
      if (route.provider === "gemini") {
        const text = await this.callGemini(options, systemPrompt, route.model);
        return { text, provider: "gemini", model: route.model };
      } else if (route.provider === "groq") {
        const text = await this.callGroq(options, systemPrompt, route.model);
        return { text, provider: "groq", model: route.model };
      }
    } catch (err: any) {
      console.warn(`Primary provider (${route.provider}) failed: ${err.message}. Attempting fallback provider...`);
    }

    // Fallback Logic
    try {
      if (route.provider === "groq" && process.env.GEMINI_API_KEY) {
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const text = await this.callGemini(options, systemPrompt, model);
        return { text, provider: "gemini (fallback)", model };
      } else if (route.provider === "gemini" && process.env.GROQ_API_KEY) {
        const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
        const text = await this.callGroq(options, systemPrompt, model);
        return { text, provider: "groq (fallback)", model };
      }
    } catch (fallbackErr: any) {
      console.error(`Fallback provider also failed: ${fallbackErr.message}`);
    }

    // Friendly offline conversational fallback response if no API keys configured or both down
    return {
      text: this.getOfflineFallbackResponse(
        options.routingInput.message,
        options.routingInput.language,
        options.routingInput.emotion,
        options.routingInput.personality
      ),
      provider: "fallback",
      model: "offline-rule-engine"
    };
  }

  private static async callGemini(options: GenerationOptions, systemPrompt: string, modelName: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    });

    const parts: any[] = [];
    
    // Add text prompt
    parts.push(options.routingInput.message);

    // Add file attachments if any
    if (options.routingInput.fileAttachments) {
      for (const file of options.routingInput.fileAttachments) {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: typeof file.data === "string" ? file.data : file.data.toString("base64")
          }
        });
      }
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();
  }

  private static async callGroq(options: GenerationOptions, systemPrompt: string, modelName: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

    const messages = [
      { role: "system", content: systemPrompt },
      ...(options.conversationHistory || []).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: options.routingInput.message }
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API returned ${res.status}: ${errText}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
  }

  private static getOfflineFallbackResponse(message: string, lang?: string, emotion?: string, personality?: string): string {
    const textLower = (message || "").toLowerCase();

    // Bengali response tree
    if (lang === "bn") {
      if (textLower.includes("প্রজেক্ট") || textLower.includes("পড়াশোনা") || textLower.includes("কোড")) {
        return "তোমার প্রজেক্ট বা পড়া নিয়ে আমি সাহায্য করতে প্রস্তুত! 💻 তোমার সমস্যাটি আরেকটু খুলে বলো, আমরা একসাথে সমাধান বের করব। (নোট: `.env` ফাইলে তোমার `GROQ_API_KEY` বা `GEMINI_API_KEY` যোগ করলে লাইভ ক্লাউড মডেল সক্রিয় হবে!)";
      }
      if (emotion === "sad") {
        return "আহা 😔 মন খারাপ করো না। তোমার যা বলতে ইচ্ছা করে বলো, আমি তোমার কথা শুনতে এখানে আছি। 💙";
      }
      if (emotion === "happy" || emotion === "excited") {
        return "দারুণ! 🎉 শুনে খুব ভালো লাগলো! বলো আজ তোমার দিনটা কেমন কাটলো?";
      }
      if (textLower.includes("কেমন আছ") || textLower.includes("কেমন আছেন")) {
        return "আমি TosnosAI, খুব ভালো আছি! 🤖 তুমি কেমন আছো? তোমার সাথে গল্প করতে পেরে আমার খুব আনন্দ হচ্ছে।";
      }
      return "আমি তোমার কথা পেয়েছি! 😊 তোমার প্রশ্নের উত্তর দিতে আমি প্রস্তুত। (টিপস: `.env` ফাইলে `GEMINI_API_KEY` অথবা `GROQ_API_KEY` বসিয়ে দিলে TosnosAI রিয়েল-টাইম ক্লাউড মডেলে কথা বলবে!)";
    }

    // Banglish response tree
    if (lang === "banglish") {
      if (textLower.includes("bhalo") || textLower.includes("kemon")) {
        return "Ami TosnosAI, khub bhalo achi! 🤖 Tumi kemon acho? Amr shathe kotha bolar jonno dhonnobad! (Tip: .env file e API Key dile live AI response pabe)";
      }
      if (emotion === "sad") {
        return "Aha 😔 mon kharap koro na. Ami sobmomoy tomar shathe achi 💙";
      }
      return "Ami bujhte parsi! 😊 Tomar project ba kotha niye amr shathe share koro! (.env file e GEMINI_API_KEY ba GROQ_API_KEY add koro live cloud model er jonno!)";
    }

    // English response tree
    if (textLower.includes("hello") || textLower.includes("hi") || textLower.includes("hey")) {
      return "Hello there! I'm TosnosAI. 🎙️ How can I assist you today? Feel free to speak or type in any language!";
    }

    if (textLower.includes("who are you") || textLower.includes("what is tosnosai")) {
      return "I am TosnosAI — your multilingual, emotion-aware AI voice conversation platform! 🧠 (To enable full live cloud reasoning, please add your `GEMINI_API_KEY` or `GROQ_API_KEY` in the `.env` file).";
    }

    return "I heard you loud and clear! 🎙️ TosnosAI is ready to chat. (To connect directly to Gemini or Groq cloud AI, please add your `GEMINI_API_KEY` or `GROQ_API_KEY` in `.env`!)";
  }
}
