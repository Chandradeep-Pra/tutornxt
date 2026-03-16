import { NextRequest, NextResponse } from "next/server";

const ttsApiUrl = process.env.TTS_API_URL ?? "http://testing-zone-five.vercel.app/api/viva/tts";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { text?: string };

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }

  const response = await fetch(ttsApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: body.text.trim() }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "TTS request failed." }, { status: 502 });
  }

  const audioBuffer = await response.arrayBuffer();

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
