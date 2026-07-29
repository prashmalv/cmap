import { NextRequest, NextResponse } from "next/server";

const REGION = process.env.AZURE_SPEECH_REGION ?? "eastus";
const TTS_URL = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

function buildSSML(text: string, lang: string): string {
  const isHindi = lang === "hi";
  const voiceName = isHindi ? "hi-IN-SwaraNeural" : "hi-IN-MadhurNeural";
  const xmlLang = isHindi ? "hi-IN" : "hi-IN";
  const safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<speak version='1.0' xml:lang='${xmlLang}'>
  <voice xml:lang='${xmlLang}' xml:gender='Female' name='${voiceName}'>
    <prosody rate='-5%' pitch='+0%'>${safeText}</prosody>
  </voice>
</speak>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.AZURE_SPEECH_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Azure Speech not configured" }, { status: 503 });
  }

  let text: string;
  let lang = "hi";
  try {
    const body = await req.json();
    text = body.text;
    if (body.lang) lang = body.lang;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "Empty text" }, { status: 400 });
  }

  const ssml = buildSSML(text.slice(0, 800), lang);

  const azRes = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "careermap-ai",
    },
    body: ssml,
  });

  if (!azRes.ok) {
    const err = await azRes.text();
    console.error("[TTS] Azure error", azRes.status, err);
    return NextResponse.json({ error: "TTS upstream error" }, { status: 502 });
  }

  const audio = await azRes.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
