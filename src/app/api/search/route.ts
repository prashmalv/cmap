import { NextRequest, NextResponse } from "next/server";
import { createLLMProvider } from "@/lib/llm/factory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const careerId = searchParams.get("careerId");

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  try {
    const llm = createLLMProvider();

    const systemPrompt = `You are a real-time career information assistant for India.
Your job is to provide the latest and most accurate information about government job exams,
notifications, eligibility, and career-related news in India.

IMPORTANT: If you are not certain about specific dates or notification numbers, say so clearly
and suggest the user check the official website. Never fabricate exam dates or vacancy numbers.

Format your response in a clean, structured way with:
- Current status / latest news
- Key dates (if known)
- Official website to check
- Quick action for the user`;

    const userMessage = careerId
      ? `Latest news and notifications for: ${query} (Career: ${careerId}).
         What are the current exam notifications, vacancy counts, and important deadlines?
         Suggest official websites.`
      : `Latest information about: ${query}. Provide current status, recent notifications, and where to check official updates.`;

    const response = await llm.chat(
      [{ role: "user", content: userMessage }],
      systemPrompt
    );

    return NextResponse.json({
      query,
      result: response,
      disclaimer: "This information is based on AI training data. Please verify from official websites for the latest updates.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
