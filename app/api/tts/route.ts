import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "bn";
  return handleTtsRequest(text, lang);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const lang = body.lang || "bn";
    return handleTtsRequest(text, lang);
  } catch (e) {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
}

async function handleTtsRequest(text: string, lang: string) {
  try {
    if (!text.trim()) {
      return new NextResponse("Text parameter is required", { status: 400 });
    }

    const cleanText = text.trim();
    const isBangla = /[\u0980-\u09FF]/.test(cleanText) || lang === "bn" || lang === "bn-BD" || lang === "banglish";
    const targetLang = isBangla ? "bn" : "en";
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=tw-ob`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch TTS audio", { status: 500 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch (error: any) {
    console.error("TTS API Proxy error:", error);
    return new NextResponse("Internal TTS error", { status: 500 });
  }
}
