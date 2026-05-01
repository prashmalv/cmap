import { NextRequest, NextResponse } from "next/server";
import { createLLMProvider } from "@/lib/llm/factory";
import { buildCareerSystemPrompt } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { messages, profile, selectedCareer, language } = await req.json();

    const llm = createLLMProvider();
    const systemPrompt = buildCareerSystemPrompt(profile, selectedCareer, language ?? "hinglish");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        await llm.stream(messages, systemPrompt, ({ text, done }) => {
          if (done) {
            controller.close();
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
