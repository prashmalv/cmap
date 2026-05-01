import OpenAI from "openai";
import type { LLMProvider, Message, StreamChunk } from "../types";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) onChunk({ text, done: false });
    }
    onChunk({ text: "", done: true });
  }
}
