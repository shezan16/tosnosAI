import { NextRequest, NextResponse } from "next/server";
import { AIRouter } from "@backend/ai-router/ai-router";
import { NodeEmotionEngine } from "@backend/services/emotion-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, language, personality, history, memories, fileAttachments, conversationId } = body;

    if (!message && (!fileAttachments || fileAttachments.length === 0)) {
      return NextResponse.json({ error: "Message content or attachment is required" }, { status: 400 });
    }

    // 1. Multilingual Emotion Analysis (Attempt Python FastAPI Emotion AI Service first, fallback to Node Engine)
    let emotionResult: any = null;
    const pythonApiUrl = process.env.EMOTION_API_URL || "http://localhost:8001";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

      const emoRes = await fetch(`${pythonApiUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text: message || "File attachment",
          context: (history || []).slice(-4)
        })
      });
      clearTimeout(timeoutId);

      if (emoRes.ok) {
        emotionResult = await emoRes.json();
      }
    } catch (e: any) {
      console.warn("Python Emotion Service notice (using fallback engine):", e.message || e);
    }

    // Force strict per-message language detection for accuracy
    const currentMessageLang = NodeEmotionEngine.detectLanguage(message || "");

    // Fallback if Python service is offline or timed out
    if (!emotionResult) {
      emotionResult = NodeEmotionEngine.analyze(message || "File attachment", currentMessageLang);
    } else {
      emotionResult.language = currentMessageLang;
    }

    // 2. AI Router Decision & Response Generation
    const result = await AIRouter.generateResponse({
      routingInput: {
        message: message || "Please inspect this file/image.",
        language: currentMessageLang,
        emotion: emotionResult,
        personality: personality || "casual",
        requiresVision: fileAttachments && fileAttachments.length > 0,
        requiresLongContext: (message || "").length > 1000,
        fileAttachments
      },
      conversationHistory: history || [],
      userMemories: memories || []
    });

    return NextResponse.json({
      success: true,
      response: result.text,
      provider: result.provider,
      model: result.model,
      emotion: emotionResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}
