import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured for server STT" }, { status: 500 });
    }

    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, "recording.webm");
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("response_format", "json");
    groqFormData.append("prompt", "Bengali and English speech conversation (বাংলা ও ইংরেজি কথা).");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.warn("Groq Whisper STT notice:", errText);
      return NextResponse.json({ error: `STT service error: ${groqRes.status}` }, { status: 500 });
    }

    const data = await groqRes.json();
    return NextResponse.json({
      success: true,
      text: data.text || "",
    });
  } catch (error: any) {
    console.error("STT API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}
