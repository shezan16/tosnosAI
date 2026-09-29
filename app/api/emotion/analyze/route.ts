import { NextRequest, NextResponse } from "next/server";
import { NodeEmotionEngine } from "@backend/services/emotion-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, language } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required for emotion analysis" }, { status: 400 });
    }

    // Try calling external Python emotion microservice first if running
    const pythonServiceUrl = process.env.EMOTION_SERVICE_URL || "http://localhost:8000";
    try {
      const pyRes = await fetch(`${pythonServiceUrl}/api/analyze-emotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: language || "auto" }),
        signal: AbortSignal.timeout(1500) // fast 1.5s timeout fallback
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        return NextResponse.json(pyData);
      }
    } catch (e) {
      // Microservice offline, seamless Node fallback
    }

    // Node Emotion Engine execution
    const result = NodeEmotionEngine.analyze(text, language);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: "Emotion engine failed", detail: err.message }, { status: 500 });
  }
}
