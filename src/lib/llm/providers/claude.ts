import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, Message, StreamChunk } from "../types";

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  async stream(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        onChunk({ text: event.delta.text, done: false });
      }
    }
    onChunk({ text: "", done: true });
  }
}
