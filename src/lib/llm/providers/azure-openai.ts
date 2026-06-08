import { AzureOpenAI } from "openai";
import type { LLMProvider, Message, StreamChunk } from "../types";

export class AzureOpenAIProvider implements LLMProvider {
  private client: AzureOpenAI;
  private deployment: string;

  constructor(
    endpoint: string,
    apiKey: string,
    deployment = "gpt-5",
    apiVersion = "2025-04-01-preview"
  ) {
    this.client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
    this.deployment = deployment;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.deployment,
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
      model: this.deployment,
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
