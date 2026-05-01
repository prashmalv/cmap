import type { LLMProvider } from "./types";

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "claude";

  if (provider === "openai") {
    const { OpenAIProvider } = require("./providers/openai");
    return new OpenAIProvider(
      process.env.OPENAI_API_KEY!,
      process.env.OPENAI_MODEL
    );
  }

  if (provider === "gemini") {
    const { GeminiProvider } = require("./providers/gemini");
    return new GeminiProvider(
      process.env.GEMINI_API_KEY!,
      process.env.GEMINI_MODEL
    );
  }

  // Default: Claude
  const { ClaudeProvider } = require("./providers/claude");
  return new ClaudeProvider(
    process.env.ANTHROPIC_API_KEY!,
    process.env.CLAUDE_MODEL
  );
}
