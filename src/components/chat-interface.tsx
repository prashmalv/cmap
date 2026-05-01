"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Search, Bot, User, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useProfileStore } from "@/store/profile";
import { getCareerById } from "@/lib/career-engine";
import { useT } from "@/lib/i18n";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactMarkdown = require("react-markdown").default;

export function ChatInterface() {
  const { profile, selectedCareerId, chatHistory, addChatMessage, clearChat, language } = useProfileStore();
  const tr = useT(language);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [newsQuery, setNewsQuery] = useState("");
  const [newsResult, setNewsResult] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedCareer = selectedCareerId ? getCareerById(selectedCareerId) : null;

  const SUGGESTED_QUESTIONS = [
    tr("chat_q1"),
    tr("chat_q2"),
    tr("chat_q3"),
    tr("chat_q4"),
    tr("chat_q5"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingText]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMsg = { role: "user" as const, content: text.trim() };
    addChatMessage(userMsg);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    const messages = [...chatHistory, userMsg];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, profile, selectedCareer, language }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const { text } = JSON.parse(line.slice(6));
            fullText += text;
            setStreamingText(fullText);
          } catch {}
        }
      }

      addChatMessage({ role: "assistant", content: fullText });
      setStreamingText("");
    } catch {
      addChatMessage({ role: "assistant", content: tr("chat_error") });
    } finally {
      setIsLoading(false);
    }
  }

  async function searchNews() {
    if (!newsQuery.trim()) return;
    setNewsLoading(true);
    setNewsResult(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(newsQuery)}&careerId=${selectedCareerId ?? ""}`
      );
      const data = await res.json();
      setNewsResult(data.result ?? data.error);
    } finally {
      setNewsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Career context banner */}
      {selectedCareer && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-700" />
          <span className="text-sm text-blue-700 font-medium">
            {tr("chat_context")} {selectedCareer.title}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-700" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{tr("chat_counselor_title")}</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
              {profile
                ? `${language === "hi" ? "नमस्ते" : "Namaste"} ${profile.name}! ${tr("chat_welcome")}`
                : tr("chat_welcome_noprofile")}
            </p>
            <div className="grid gap-2 w-full max-w-sm">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors text-slate-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-orange-500 text-white" : "bg-blue-700 text-white"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-orange-500 text-white rounded-tr-none"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </motion.div>
        ))}

        {streamingText && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[80%] bg-white border border-slate-200 rounded-xl rounded-tl-none px-3 py-2 text-sm text-slate-800">
              <div className="prose prose-sm max-w-none"><ReactMarkdown>{streamingText}</ReactMarkdown></div>
              <span className="inline-block w-1.5 h-4 bg-blue-700 animate-pulse ml-0.5" />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* News search */}
      <div className="border-t border-slate-100 px-4 py-2">
        <div className="flex gap-2 mb-2">
          <input
            value={newsQuery}
            onChange={(e) => setNewsQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchNews()}
            placeholder={tr("chat_news_placeholder")}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button size="sm" variant="muted" onClick={searchNews} disabled={newsLoading} className="text-xs">
            {newsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          </Button>
        </div>
        {newsResult && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-slate-700 max-h-32 overflow-y-auto mb-2"
            >
              <p className="font-medium text-blue-700 mb-1 flex items-center gap-1">
                <Search className="w-3 h-3" /> {tr("chat_news_result")}
              </p>
              {newsResult}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder={tr("chat_placeholder")}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-xl w-10 h-10 bg-blue-700 hover:bg-blue-800"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
          {chatHistory.length > 0 && (
            <Button onClick={clearChat} variant="ghost" size="icon" className="rounded-xl w-10 h-10">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
