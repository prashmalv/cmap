import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, language, topic } = body;

    // Log to server console (wire to DB / SMS / email later)
    console.log("[CareerMap Callback Request]", {
      name: name || "Not provided",
      phone,
      language,
      topic: topic || "General career guidance",
      timestamp: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
