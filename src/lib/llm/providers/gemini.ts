import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, Message, StreamChunk } from "../types";

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-1.5-pro") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  private toGeminiHistory(messages: Message[]) {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });
    const history = this.toGeminiHistory(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1];
    const chat = genModel.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  }

  async stream(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });
    const history = this.toGeminiHistory(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1];
    const chat = genModel.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) onChunk({ text, done: false });
    }
    onChunk({ text: "", done: true });
  }
}
