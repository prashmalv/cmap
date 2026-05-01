export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMConfig {
  provider: "claude" | "openai" | "gemini";
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface LLMProvider {
  chat(messages: Message[], systemPrompt: string): Promise<string>;
  stream(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>;
}
