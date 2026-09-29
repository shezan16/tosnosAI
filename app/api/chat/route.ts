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

    // 1. Multilingual Emotion Analysis
    const emotionResult = NodeEmotionEngine.analyze(message || "File attachment", language);

    // 2. AI Router Decision & Response Generation
    const result = await AIRouter.generateResponse({
      routingInput: {
        message: message || "Please inspect this file/image.",
        language: emotionResult.language,
        emotion: emotionResult.emotion,
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
