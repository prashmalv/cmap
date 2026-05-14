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
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 20;

      function checkPage(needed = 12) {
        if (y + needed > pageH - 15) { doc.addPage(); y = 22; }
      }

      function setStyle(size: number, style: "normal" | "bold" | "italic" = "normal", hex = "#334155") {
        doc.setFontSize(size);
        doc.setFont("helvetica", style);
        doc.setTextColor(hex);
      }

      function writeLine(text: string, size: number, style: "normal" | "bold" | "italic", hex: string, indent = 0) {
        setStyle(size, style, hex);
        const wrapped = doc.splitTextToSize(text, contentW - indent);
        wrapped.forEach((l: string) => { checkPage(size * 0.5); doc.text(l, margin + indent, y); y += size * 0.46; });
      }

      function addSection(title: string) {
        y += 5; checkPage(14);
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(margin - 3, y - 6, contentW + 6, 11, 2, 2, "FD");
        writeLine(title, 11, "bold", "#1d4ed8");
        y += 3;
      }

      // Strip inline markdown symbols, keep text
      function cleanInline(text: string): string {
        return text
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
          .trim();
      }

      // Render a parsed markdown table as a proper grid
      function renderTable(rows: string[][]) {
        if (rows.length === 0) return;
        const cols = Math.max(...rows.map((r) => r.length));
        const colW = contentW / cols;
        const rowH = 8;
        rows.forEach((row, ri) => {
          checkPage(rowH + 2);
          if (ri === 0) doc.setFillColor(219, 234, 254);
          else doc.setFillColor(ri % 2 === 0 ? 241 : 255, ri % 2 === 0 ? 245 : 255, ri % 2 === 0 ? 255 : 255);
          doc.setDrawColor(203, 213, 225);
          doc.rect(margin, y - 5.5, contentW, rowH, "FD");
          row.forEach((cell, ci) => {
            setStyle(8, ri === 0 ? "bold" : "normal", ri === 0 ? "#1d4ed8" : "#374151");
            const cellText = doc.splitTextToSize(cleanInline(cell), colW - 3);
            doc.text(cellText[0] ?? "", margin + ci * colW + 2, y);
          });
          y += rowH;
        });
        y += 3;
      }

      // Full markdown renderer: handles headings, bullets, numbered lists, tables
      function renderMarkdown(content: string) {
        const lines = content.split("\n");
        let i = 0;
        while (i < lines.length) {
          const raw = lines[i];
          const t = raw.trim();

          if (!t) { y += 2; i++; continue; }

          // Table block
          if (t.startsWith("|")) {
            const tableRows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
              const row = lines[i].trim();
              // skip separator rows like |---|---|
              if (!/^[\|\s\-:]+$/.test(row)) {
                const cells = row.split("|").slice(1, -1).map((c) => c.trim());
                if (cells.length) tableRows.push(cells);
              }
              i++;
            }
            if (tableRows.length) renderTable(tableRows);
            continue;
          }

          // H1
          if (t.startsWith("# ")) {
            y += 2; checkPage(10);
            writeLine(cleanInline(t.slice(2)), 13, "bold", "#1e293b");
            y += 2; i++; continue;
          }
          // H2
          if (t.startsWith("## ")) {
            y += 2; checkPage(8);
            writeLine(cleanInline(t.slice(3)), 11, "bold", "#1d4ed8");
            y += 1; i++; continue;
          }
          // H3
          if (t.startsWith("### ")) {
            checkPage(7);
            writeLine(cleanInline(t.slice(4)), 10, "bold", "#374151");
            y += 1; i++; continue;
          }

          // Bullet
          const bullet = t.match(/^[-*•]\s+(.+)/);
          if (bullet) {
            checkPage(6);
            setStyle(9, "normal", "#374151");
            const wrapped = doc.splitTextToSize("• " + cleanInline(bullet[1]), contentW - 6);
            wrapped.forEach((l: string, li: number) => {
              checkPage(5); doc.text(li === 0 ? l : "  " + l, margin + 4, y); y += 4.5;
            });
            i++; continue;
          }

          // Numbered list
          const numbered = t.match(/^(\d+)[.)]\s+(.+)/);
          if (numbered) {
            checkPage(6);
            setStyle(9, "normal", "#374151");
            const wrapped = doc.splitTextToSize(`${numbered[1]}. ${cleanInline(numbered[2])}`, contentW - 6);
            wrapped.forEach((l: string, li: number) => {
              checkPage(5); doc.text(li === 0 ? l : "   " + l, margin + 4, y); y += 4.5;
            });
            i++; continue;
          }

          // Horizontal rule
          if (/^[-_*]{3,}$/.test(t)) {
            checkPage(5);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, margin + contentW, y);
            y += 4; i++; continue;
          }

          // Plain text
          const cleaned = cleanInline(t);
          if (cleaned) writeLine(cleaned, 9, "normal", "#374151");
          i++;
        }
      }

      // ─── HEADER ─────────────────────────────────────────
      doc.setFillColor(29, 78, 216);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setFillColor(251, 146, 60);
      doc.rect(0, 25, pageW, 3, "F");
      setStyle(19, "bold", "#ffffff");
      doc.text("CareerMap AI", margin, 14);
      setStyle(10, "normal", "#bfdbfe");
      doc.text("Personalized Career Counseling Report", margin, 22);
      setStyle(9, "normal", "#bfdbfe");
      const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      doc.text(dateStr, pageW - margin - doc.getTextWidth(dateStr) - 1, 22);
      y = 40;

      // ─── PROFILE ────────────────────────────────────────
      addSection("👤 Candidate Profile");
      writeLine(`${profile.name}   ·   Age: ${profile.age} yrs   ·   Category: ${(profile.caste_category ?? "general").toUpperCase()}`, 10, "bold", "#1e293b");
      writeLine(`Education: ${profile.education}`, 9, "normal", "#475569");
      if (profile.experience_years > 0)
        writeLine(`Experience: ${profile.experience_years} yrs${profile.experience_domain ? ` — ${profile.experience_domain}` : ""}`, 9, "normal", "#475569");
      writeLine(`Interests: ${profile.interests?.join(", ") || "Not specified"}   ·   Location: ${profile.location}`, 9, "normal", "#475569");

      // ─── CAREER ─────────────────────────────────────────
      if (selectedCareer) {
        addSection(`🎯 Career: ${selectedCareer.title}${selectedCareer.title_hi ? ` (${selectedCareer.title_hi})` : ""}`);
        if (selectedCareer.description) writeLine(selectedCareer.description, 9, "normal", "#475569");
        y += 1;
        writeLine(
          `Entry Salary: ${selectedCareer.salary_range?.entry || "—"}   ·   Senior: ${selectedCareer.salary_range?.senior || "—"}   ·   Timeline: ${selectedCareer.timeline_to_enter || "—"}`,
          9, "normal", "#374151"
        );
      }

      // ─── AI CONVERSATION ────────────────────────────────
      const aiMessages = chatHistory.filter((m) => m.role === "assistant");
      if (aiMessages.length > 0) {
        addSection("💬 AI Counseling Session");
        aiMessages.forEach((msg, idx) => {
          if (idx > 0) {
            y += 4; checkPage(8);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y - 2, margin + contentW, y - 2);
            y += 3;
          }
          if (aiMessages.length > 1) { writeLine(`Response ${idx + 1}`, 9, "bold", "#6b7280"); y += 1; }
          renderMarkdown(msg.content);
          y += 2;
        });
      }

      // ─── MENTOR ─────────────────────────────────────────
      if (mentors.length > 0) {
        addSection("🤝 Suggested Mentor / Expert");
        mentors.slice(0, 2).forEach((m) => {
          checkPage(30);
          doc.setFillColor(240, 253, 244);
          doc.setDrawColor(167, 243, 208);
          doc.roundedRect(margin, y - 4, contentW, 26, 2, 2, "FD");
          writeLine(`${m.avatar}  ${m.name}`, 10, "bold", "#065f46");
          writeLine(`${m.role}  ·  ${m.org}`, 9, "normal", "#374151");
          writeLine(`Expertise: ${m.expertise}`, 9, "normal", "#374151");
          writeLine(`Portal: ${m.contact}`, 9, "normal", "#0369a1");
          y += 8;
        });
      }

      // ─── PAGE FOOTERS ────────────────────────────────────
      const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        setStyle(7.5, "normal", "#94a3b8");
        doc.text(
          `CareerMap AI  |  careermap-ai.azurewebsites.net  |  For guidance only — verify from official sources  |  Page ${p} / ${totalPages}`,
          margin, pageH - 7
        );
      }

      doc.save(`CareerMap_Report_${profile.name.replace(/\s+/g, "_")}.pdf`);
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
