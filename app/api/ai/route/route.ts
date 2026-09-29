import { NextRequest, NextResponse } from "next/server";
import { AIRouter } from "@backend/ai-router/ai-router";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const decision = AIRouter.decideRoute({
      message: body.message || "",
      language: body.language || "bn",
      emotion: body.emotion || "neutral",
      requiresVision: body.requires_vision || false,
      requiresLongContext: body.requires_long_context || false
    });

    return NextResponse.json(decision);
  } catch (err: any) {
    return NextResponse.json({ error: "Routing error", detail: err.message }, { status: 500 });
  }
}
