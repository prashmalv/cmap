"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Search, Bot, User, RefreshCw, FileDown, UserCheck, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { useProfileStore } from "@/store/profile";
import { getCareerById } from "@/lib/career-engine";
import { getMentorsForCareer } from "@/lib/mentors";
import { useT } from "@/lib/i18n";
import type { UserProfile } from "@/lib/career-engine";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactMarkdown = require("react-markdown").default;

function buildAutoPrompt(profile: UserProfile, careerTitle: string, lang: string): string {
  const langNote = lang === "hi" ? "हिंदी में उत्तर दें।" : lang === "hinglish" ? "Hinglish mein jawab do." : "Reply in English.";
  return `${langNote}

User Profile:
- Name: ${profile.name}, Age: ${profile.age}
- Education: ${profile.education}
- Experience: ${profile.experience_years} years${profile.experience_domain ? ` in ${profile.experience_domain}` : ""}
- Interests: ${profile.interests?.join(", ") || "Not specified"}
- Category: ${profile.caste_category}, Location: ${profile.location}

The user wants to explore the career: **${careerTitle}**

Please provide a structured career counseling overview covering:
1. **Eligibility Assessment** — Is this user currently eligible or partially eligible? What's the gap?
2. **Step-by-Step Roadmap** — Clear 3-phase plan: What to do now → in 6 months → in 1 year
3. **Key Preparation Tips** — Exams, skills, certifications needed
4. **Honest Reality Check** — Competition level, salary expectation, time commitment

End with 2 follow-up questions asking what specific aspect they want to explore deeper (like "salary details", "exam syllabus", "coaching institutes", etc).`;
}

export function ChatInterface() {
  const { profile, selectedCareerId, chatHistory, addChatMessage, clearChat, language } = useProfileStore();
  const tr = useT(language);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [newsQuery, setNewsQuery] = useState("");
  const [newsResult, setNewsResult] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showMentors, setShowMentors] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const autoStartedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedCareer = selectedCareerId ? getCareerById(selectedCareerId) : null;
  const mentors = selectedCareer ? getMentorsForCareer(selectedCareer.category) : [];

  const SUGGESTED_QUESTIONS = [
    tr("chat_q1"), tr("chat_q2"), tr("chat_q3"), tr("chat_q4"), tr("chat_q5"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingText]);

  // Auto-start conversation when career is selected and chat is empty
  useEffect(() => {
    if (
      selectedCareer &&
      profile &&
      chatHistory.length === 0 &&
      !autoStartedRef.current &&
      !isLoading
    ) {
      autoStartedRef.current = true;
      const prompt = buildAutoPrompt(profile, selectedCareer.title, language);
      sendAutoMessage(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCareerId]);

  async function sendAutoMessage(prompt: string) {
    setIsLoading(true);
    setStreamingText("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], profile, selectedCareer, language }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try { const { text } = JSON.parse(line.slice(6)); fullText += text; setStreamingText(fullText); } catch {}
        }
      }
      addChatMessage({ role: "assistant", content: fullText });
      setStreamingText("");
      setShowMentors(true);
    } catch {
      addChatMessage({ role: "assistant", content: tr("chat_error") });
    } finally {
      setIsLoading(false);
    }
  }

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
        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try { const { text } = JSON.parse(line.slice(6)); fullText += text; setStreamingText(fullText); } catch {}
        }
      }
      addChatMessage({ role: "assistant", content: fullText });
      setStreamingText("");
      if (!showMentors) setShowMentors(true);
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
      const res = await fetch(`/api/search?q=${encodeURIComponent(newsQuery)}&careerId=${selectedCareerId ?? ""}`);
      const data = await res.json();
      setNewsResult(data.result ?? data.error);
    } finally {
      setNewsLoading(false);
    }
  }

  async function generatePDF() {
    if (chatHistory.length === 0 || !profile) return;
    setPdfGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 20;

      const addText = (text: string, size = 11, style: "normal" | "bold" = "normal", color = "#1e293b") => {
        doc.setFontSize(size);
        doc.setFont("helvetica", style);
        doc.setTextColor(color);
        const lines = doc.splitTextToSize(text, contentW);
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += size * 0.45;
        });
        y += 2;
      };

      const addSection = (title: string) => {
        y += 4;
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(margin - 2, y - 5, contentW + 4, 10, 2, 2, "F");
        addText(title, 12, "bold", "#1d4ed8");
        y += 1;
      };

      // Header
      doc.setFillColor(29, 78, 216);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor("#ffffff");
      doc.text("CareerMap AI", margin, 13);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Career Counseling Report", margin, 21);
      doc.setFontSize(9); doc.setTextColor("#bfdbfe");
      doc.text(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), pageW - margin - 30, 21);
      y = 38;

      // Profile
      addSection("👤 User Profile");
      addText(`Name: ${profile.name}    Age: ${profile.age} yrs    Category: ${(profile.caste_category ?? "general").toUpperCase()}`);
      addText(`Education: ${profile.education}    Experience: ${profile.experience_years} years${profile.experience_domain ? ` — ${profile.experience_domain}` : ""}`);
      addText(`Interests: ${profile.interests?.join(", ") || "Not specified"}    Location: ${profile.location}`);

      // Career
      if (selectedCareer) {
        addSection(`🎯 Career Explored: ${selectedCareer.title}`);
        if (selectedCareer.title_hi) addText(`(${selectedCareer.title_hi})`);
        addText(selectedCareer.description || "");
        addText(`Salary Range: ${selectedCareer.salary_range?.entry || "—"} (Entry)  →  ${selectedCareer.salary_range?.senior || "—"} (Senior)`, 10);
        addText(`Timeline to Enter: ${selectedCareer.timeline_to_enter || "—"}`, 10);
      }

      // Conversation
      addSection("💬 AI Counseling Highlights");
      const aiMessages = chatHistory.filter((m) => m.role === "assistant");
      aiMessages.forEach((msg, idx) => {
        const clean = msg.content
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/#{1,3}\s/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        if (idx > 0) y += 3;
        addText(`AI Response ${idx + 1}:`, 10, "bold", "#374151");
        addText(clean.slice(0, 800) + (clean.length > 800 ? "..." : ""), 9, "normal", "#374151");
        y += 2;
      });

      // Mentor
      if (mentors.length > 0) {
        addSection("🤝 Suggested Mentor / Expert");
        const m = mentors[0];
        addText(`${m.avatar} ${m.name}`, 11, "bold");
        addText(`Role: ${m.role}`);
        addText(`Organisation: ${m.org}`);
        addText(`Expertise: ${m.expertise}`);
        addText(`Contact/Portal: ${m.contact}`);
      }

      // Footer
      doc.setFontSize(8); doc.setTextColor("#94a3b8");
      doc.text("Generated by CareerMap AI — careermap-ai.azurewebsites.net  |  For guidance only. Verify from official sources.", margin, 287);

      doc.save(`CareerMap_Report_${profile.name.replace(/\s+/g, "_")}_${selectedCareer?.title?.replace(/\s+/g, "_") || "Career"}.pdf`);
    } catch (e) {
      console.error("PDF error", e);
    } finally {
      setPdfGenerating(false);
    }
  }

  function handleClearChat() {
    clearChat();
    autoStartedRef.current = false;
    setShowMentors(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Career context banner */}
      {selectedCareer && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="text-sm text-blue-700 font-medium">
              {tr("chat_context")} {language === "hi" && selectedCareer.title_hi ? selectedCareer.title_hi : selectedCareer.title}
            </span>
          </div>
          {chatHistory.length > 0 && (
            <Button
              onClick={generatePDF}
              disabled={pdfGenerating}
              size="sm"
              variant="outline"
              className="text-xs gap-1 text-blue-700 border-blue-200 hover:bg-blue-100 shrink-0"
            >
              {pdfGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
              {language === "hi" ? "रिपोर्ट PDF" : "Report PDF"}
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Auto-loading state — show before first message */}
        {chatHistory.length === 0 && isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 animate-pulse">
              <Bot className="w-8 h-8 text-blue-700" />
            </div>
            <p className="text-sm text-slate-500">
              {language === "hi"
                ? `${selectedCareer?.title_hi || selectedCareer?.title} के बारे में आपकी प्रोफ़ाइल के अनुसार जानकारी तैयार हो रही है…`
                : language === "hinglish"
                ? `${selectedCareer?.title} ke baare mein aapke profile ke basis pe analysis ho rahi hai…`
                : `Preparing personalized guidance for ${selectedCareer?.title} based on your profile…`}
            </p>
          </div>
        )}

        {/* Empty state (no career selected) */}
        {chatHistory.length === 0 && !streamingText && !isLoading && (
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
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-left text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors text-slate-600">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {chatHistory.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-orange-500 text-white" : "bg-blue-700 text-white"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-orange-500 text-white rounded-tr-none"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"}`}>
              {msg.role === "assistant"
                ? <div className="prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                : msg.content}
            </div>
          </motion.div>
        ))}

        {/* Streaming */}
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

        {/* Mentor suggestion panel — appears after first AI response */}
        <AnimatePresence>
          {showMentors && mentors.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2"
            >
              <button
                onClick={() => setShowMentors((s) => !s)}
                className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-2"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {language === "hi" ? "सुझाए गए मेंटर / विशेषज्ञ" : language === "hinglish" ? "Suggested Mentors / Experts" : "Suggested Mentors / Experts"}
              </button>
              <div className="space-y-2">
                {mentors.map((m, i) => (
                  <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-3 items-start">
                    <div className="text-2xl shrink-0">{m.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.role} · {m.org}</p>
                      <p className="text-xs text-slate-600 mt-1">{m.expertise}</p>
                      <a href={`https://${m.contact}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 mt-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> {m.contact}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* News search */}
      <div className="border-t border-slate-100 px-4 py-2">
        <div className="flex gap-2 mb-2">
          <input value={newsQuery} onChange={(e) => setNewsQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchNews()}
            placeholder={tr("chat_news_placeholder")}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <Button size="sm" variant="muted" onClick={searchNews} disabled={newsLoading} className="text-xs">
            {newsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          </Button>
        </div>
        {newsResult && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-slate-700 max-h-32 overflow-y-auto mb-2">
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
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder={tr("chat_placeholder")}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading} />
          <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
            size="icon" className="rounded-xl w-10 h-10 bg-blue-700 hover:bg-blue-800">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
          {chatHistory.length > 0 && (
            <Button onClick={handleClearChat} variant="ghost" size="icon" className="rounded-xl w-10 h-10">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
