"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { PhoneOff, ChevronLeft, Phone } from "lucide-react";
import { useProfileStore } from "@/store/profile";
import { getCareerById } from "@/lib/career-engine";
import type { UserProfile } from "@/lib/career-engine";
import type { Lang } from "@/lib/i18n";

// ─── Web Speech API types ─────────────────────────────────────────────────────
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
}
interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;
function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}

type CallState = "idle" | "ai_speaking" | "listening" | "processing";
interface Turn { role: "user" | "ai"; text: string; }

function pickVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const isHindi = langCode === "hi-IN";
  const order = isHindi ? [
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN" && v.name.toLowerCase().includes("swara"),
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN" && v.name.toLowerCase().includes("google"),
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN" && v.name.toLowerCase().includes("female"),
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN",
    (v: SpeechSynthesisVoice) => v.lang.startsWith("hi"),
  ] : [
    (v: SpeechSynthesisVoice) => v.lang === "en-IN" && v.name.toLowerCase().includes("google"),
    (v: SpeechSynthesisVoice) => v.lang === "en-IN" && v.name.toLowerCase().includes("female"),
    (v: SpeechSynthesisVoice) => v.lang === "en-IN",
    (v: SpeechSynthesisVoice) => v.name === "Google UK English Female",
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google"),
  ];
  for (const matcher of order) { const f = voices.find(matcher); if (f) return f; }
  return null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "").replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1").replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "").replace(/\|.*?\|/g, "")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function greetingText(profile: UserProfile | null, careerTitle: string | null, lang: Lang): string {
  const name = profile?.name || "ji";
  if (lang === "hi") {
    return careerTitle
      ? `नमस्ते ${name}! मैं आपका CareerMap AI career counselor हूँ। आप ${careerTitle} के बारे में जानना चाहते हैं? बताइए, आपके मन में क्या सवाल है?`
      : `नमस्ते ${name}! मैं CareerMap AI career counselor हूँ। आज आपकी career guidance में कैसे मदद कर सकता हूँ?`;
  }
  return careerTitle
    ? `Namaste ${name}! Main aapka CareerMap AI career counselor hoon. Aap ${careerTitle} ke baare mein poochna chahte hain? Bataiye, kya sawaal hai?`
    : `Namaste ${name}! Main aapka CareerMap AI career counselor hoon. Aaj main aapki career mein kaise madad kar sakta hoon?`;
}

// ─── Animated Avatar Face ────────────────────────────────────────────────────
function CallAvatar({ state }: { state: CallState }) {
  const speaking = state === "ai_speaking";
  const listening = state === "listening";
  const loading = state === "processing";

  const headStyle: React.CSSProperties = speaking
    ? { animation: "voiceBob 0.35s ease-in-out infinite" } : {};

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {/* Listening pulse rings */}
      {listening && (<>
        <div className="absolute inset-0 rounded-full border-2 border-red-400 opacity-70"
          style={{ animation: "voiceRing 1.2s ease-out infinite" }} />
        <div className="absolute inset-0 rounded-full border-2 border-red-400 opacity-40"
          style={{ animation: "voiceRing 1.2s ease-out 0.5s infinite" }} />
      </>)}
      {/* Speaking glow */}
      {speaking && (
        <div className="absolute inset-0 rounded-full"
          style={{ animation: "voiceGlow 0.8s ease-in-out infinite", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
      )}
      <div style={headStyle}>
        <svg width="160" height="160" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="vcFace" cx="38%" cy="32%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </radialGradient>
          </defs>
          {/* Face */}
          <circle cx="50" cy="50" r="46" fill="url(#vcFace)" />
          <ellipse cx="34" cy="26" rx="13" ry="8" fill="white" opacity="0.1" />
          {/* Eyebrows */}
          <path d="M26 33 Q32 29 38 31" stroke="#a5b4fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M62 31 Q68 29 74 33" stroke="#a5b4fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Left eye */}
          <g style={{ transformOrigin: "33px 42px", animation: "vcBlink 3.8s ease-in-out infinite" }}>
            <ellipse cx="33" cy="42" rx="7" ry="7" fill="white" opacity="0.9" />
            <circle cx="34" cy="43" r="4.2" fill="#1e1b4b" />
            <circle cx="35.5" cy="41.5" r="1.4" fill="white" opacity="0.9" />
          </g>
          {/* Right eye */}
          <g style={{ transformOrigin: "67px 42px", animation: "vcBlink 3.8s ease-in-out 0.8s infinite" }}>
            <ellipse cx="67" cy="42" rx="7" ry="7" fill="white" opacity="0.9" />
            <circle cx="68" cy="43" r="4.2" fill="#1e1b4b" />
            <circle cx="69.5" cy="41.5" r="1.4" fill="white" opacity="0.9" />
          </g>
          <circle cx="50" cy="55" r="1.5" fill="#a5b4fc" opacity="0.6" />
          {/* Mouth */}
          {loading ? (<>
            <circle cx="40" cy="67" r="3" fill="#e0e7ff" opacity="0.9">
              <animate attributeName="cy" values="67;62;67" dur="0.8s" begin="0s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="67" r="3" fill="#e0e7ff" opacity="0.9">
              <animate attributeName="cy" values="67;62;67" dur="0.8s" begin="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="60" cy="67" r="3" fill="#e0e7ff" opacity="0.9">
              <animate attributeName="cy" values="67;62;67" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
            </circle>
          </>) : speaking ? (
            <ellipse cx="50" cy="67" rx="10" ry="1" fill="#e0e7ff" opacity="0.95">
              <animate attributeName="ry" values="1;7;1" dur="0.28s" repeatCount="indefinite" />
            </ellipse>
          ) : (
            <path d="M38 65 Q50 73 62 65" stroke="#e0e7ff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── Sound Wave Bars ──────────────────────────────────────────────────────────
function WaveBars({ active }: { active: boolean }) {
  const heights = [0.4, 0.7, 1, 0.85, 0.6, 0.9, 0.7, 1, 0.8, 0.5, 0.7, 0.4];
  if (!active) return null;
  return (
    <div className="flex items-center gap-[3px] h-8">
      {heights.map((h, i) => (
        <div key={i} className="w-1 rounded-full bg-indigo-400"
          style={{ height: 4, animation: `vcWave ${0.5 + (i % 4) * 0.08}s ease-in-out ${i * 0.055}s infinite`, maxHeight: 28 }} />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VoicePage() {
  const { profile, selectedCareerId, language } = useProfileStore();
  const selectedCareer = selectedCareerId ? getCareerById(selectedCareerId) : null;
  const lang: Lang = language;

  const [supported, setSupported] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interimText, setInterimText] = useState("");
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);

  const callActiveRef = useRef(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef("");
  const turnsEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const SpeechRec = getSpeechRecognition();
    setSupported(!!SpeechRec); // TTS via ElevenLabs; only need STT
  }, []);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Duration timer
  useEffect(() => {
    if (callActive && !ended) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive, ended]);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // ── TTS: speak then auto-listen (ElevenLabs → Web Speech fallback) ─────────
  const speakThenListen = useCallback(async (text: string) => {
    if (!callActiveRef.current) return;
    setCallState("ai_speaking");
    window.speechSynthesis?.cancel();
    const clean = stripMarkdown(text).slice(0, 550);

    // ── ElevenLabs path ──────────────────────────────────────────────────────
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, lang }),
      });
      if (!res.ok) throw new Error("EL " + res.status);
      const buf = await res.arrayBuffer();
      if (!callActiveRef.current) return;
      try { audioCtxRef.current?.close(); } catch {}
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const decoded = await ctx.decodeAudioData(buf);
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      src.onended = () => {
        try { ctx.close(); } catch {}
        if (callActiveRef.current) startListening();
      };
      src.start(0);
      return;
    } catch {
      // fall through to Web Speech API
    }

    // ── Web Speech API fallback ──────────────────────────────────────────────
    if (!window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(clean);
    const langCode = lang === "hi" ? "hi-IN" : "en-IN";
    utt.lang = langCode;
    const bestVoice = pickVoice(langCode);
    if (bestVoice) utt.voice = bestVoice;
    utt.rate = bestVoice ? 0.87 : 0.80;
    utt.pitch = 1.0;
    utt.volume = 1;
    utt.onend = () => { if (callActiveRef.current) startListening(); };
    utt.onerror = () => { if (callActiveRef.current) startListening(); };
    window.speechSynthesis.speak(utt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ── STT: listen for user speech ──────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!callActiveRef.current) return;
    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) return;
    recognitionRef.current?.abort();
    transcriptRef.current = "";
    setInterimText("");

    const rec = new SpeechRec();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => { if (callActiveRef.current) setCallState("listening"); };

    rec.onresult = (e: ISpeechRecognitionEvent) => {
      let interim = ""; let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      transcriptRef.current = final || interim;
      setInterimText(final || interim);
    };

    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      if (callActiveRef.current) setTimeout(startListening, 400);
    };

    rec.onend = () => {
      const said = transcriptRef.current.trim();
      setInterimText("");
      if (!callActiveRef.current) return;
      if (said) {
        sendToAI(said);
      } else {
        setTimeout(startListening, 300);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { setTimeout(startListening, 500); }
  }, [lang]);

  // ── AI: fetch response ───────────────────────────────────────────────────
  const sendToAI = useCallback(async (userText: string) => {
    if (!callActiveRef.current) return;
    setCallState("processing");
    setTurns(prev => [...prev, { role: "user", text: userText }]);

    const userMsg = { role: "user", content: userText };
    const messages = [...conversationRef.current, userMsg];
    conversationRef.current = messages;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, profile, selectedCareer, language: lang }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try { const { text } = JSON.parse(line.slice(6)); fullText += text; } catch {}
        }
      }
      if (!callActiveRef.current) return;
      conversationRef.current = [...messages, { role: "assistant", content: fullText }];
      setTurns(prev => [...prev, { role: "ai", text: fullText }]);
      speakThenListen(fullText);
    } catch {
      if (callActiveRef.current) startListening();
    }
  }, [profile, selectedCareer, lang, speakThenListen, startListening]);

  // ── Start call ───────────────────────────────────────────────────────────
  function startCall() {
    if (!supported) return;
    setCallActive(true);
    setEnded(false);
    setDuration(0);
    setTurns([]);
    conversationRef.current = [];
    callActiveRef.current = true;
    const greeting = greetingText(profile, selectedCareer?.title ?? null, lang);
    setTurns([{ role: "ai", text: greeting }]);
    conversationRef.current = [{ role: "assistant", content: greeting }];
    speakThenListen(greeting);
  }

  // ── End call ─────────────────────────────────────────────────────────────
  function endCall() {
    callActiveRef.current = false;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    try { audioCtxRef.current?.close(); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState("idle");
    setCallActive(false);
    setEnded(true);
  }

  const stateLabel = {
    idle: lang === "hi" ? "तैयार हूँ…" : "Ready…",
    listening: lang === "hi" ? "सुन रहा हूँ…" : "Sun raha hoon…",
    processing: lang === "hi" ? "सोच रहा हूँ…" : "Soch raha hoon…",
    ai_speaking: lang === "hi" ? "बोल रहा हूँ…" : "Bol raha hoon…",
  }[callState];

  const stateColor = {
    idle: "text-slate-400",
    listening: "text-red-400",
    processing: "text-amber-400",
    ai_speaking: "text-indigo-400",
  }[callState];

  // ── Pre-call screen ───────────────────────────────────────────────────────
  if (!callActive && !ended) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <style>{`
          @keyframes vcBlink{0%,96%{transform:scaleY(1)}98%{transform:scaleY(0.05)}100%{transform:scaleY(1)}}
          @keyframes voiceBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          @keyframes voiceRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.7);opacity:0}}
          @keyframes voiceGlow{0%,100%{opacity:0}50%{opacity:1}}
          @keyframes vcWave{0%,100%{height:4px}50%{height:20px}}
        `}</style>
        <div className="flex items-center p-4 border-b border-slate-800">
          <Link href="/chat" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <CallAvatar state="idle" />
          <h1 className="text-white text-2xl font-bold mt-6 mb-1">CareerMap AI</h1>
          <p className="text-indigo-400 text-sm mb-2">
            {lang === "hi" ? "आपका AI Career Counselor" : "Aapka AI Career Counselor"}
          </p>
          {selectedCareer && (
            <div className="mt-2 mb-4 bg-indigo-900/40 border border-indigo-700/40 rounded-xl px-4 py-2">
              <p className="text-indigo-300 text-xs">
                {lang === "hi" ? "विषय: " : "Topic: "}
                <span className="font-semibold text-white">{selectedCareer.title}</span>
              </p>
            </div>
          )}
          {!supported ? (
            <div className="bg-red-900/30 border border-red-700/40 rounded-xl p-4 max-w-xs mt-4">
              <p className="text-red-300 text-sm">
                {lang === "hi"
                  ? "आपका browser voice call support नहीं करता। Chrome पर try करें।"
                  : "Aapka browser voice call support nahi karta. Chrome pe try karein."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
                {lang === "hi"
                  ? "AI counselor से directly बात करें। बोलें, वो सुनेगा — फिर Hindi में जवाब देगा।"
                  : "AI counselor se directly baat karein. Bolein, wo sunegaa — phir Hinglish mein jawab degaa."}
              </p>
              <button
                onClick={startCall}
                className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <Phone className="w-8 h-8 text-white" />
              </button>
              <p className="text-slate-500 text-xs mt-4">
                {lang === "hi" ? "call शुरू करने के लिए tap करें" : "call shuru karne ke liye tap karein"}
              </p>
            </>
          )}
        </div>
        <div className="p-4 text-center">
          <Link href="/callback" className="text-indigo-400 hover:text-indigo-300 text-sm underline-offset-2 hover:underline">
            {lang === "hi" ? "या हमें अपना नंबर दें, हम call करेंगे →" : "Ya hamein apna number dein, hum call karenge →"}
          </Link>
        </div>
      </div>
    );
  }

  // ── Post-call screen ──────────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
        <style>{`@keyframes vcBlink{0%,96%{transform:scaleY(1)}98%{transform:scaleY(0.05)}100%{transform:scaleY(1)}}`}</style>
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
          <PhoneOff className="w-7 h-7 text-slate-300" />
        </div>
        <h2 className="text-white text-xl font-bold mb-1">
          {lang === "hi" ? "Call समाप्त" : "Call Khatam"}
        </h2>
        <p className="text-slate-400 text-sm mb-6">{formatDuration(duration)}</p>
        <div className="bg-slate-800 rounded-2xl p-4 max-w-sm w-full text-left max-h-64 overflow-y-auto space-y-3 mb-6">
          {turns.map((t, i) => (
            <div key={i} className={`text-sm leading-relaxed ${t.role === "user" ? "text-orange-300" : "text-slate-200"}`}>
              <span className="text-xs opacity-50 block mb-0.5">
                {t.role === "user" ? (lang === "hi" ? "आप" : "Aap") : "CareerMap AI"}
              </span>
              {t.text.slice(0, 120)}{t.text.length > 120 ? "…" : ""}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEnded(false); setCallActive(false); }}
            className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            {lang === "hi" ? "फिर call करें" : "Phir call karein"}
          </button>
          <Link href="/chat"
            className="px-5 py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors">
            {lang === "hi" ? "Chat में जाएं" : "Chat mein jaayein"}
          </Link>
        </div>
      </div>
    );
  }

  // ── Active call screen ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <style>{`
        @keyframes vcBlink{0%,96%{transform:scaleY(1)}98%{transform:scaleY(0.05)}100%{transform:scaleY(1)}}
        @keyframes voiceBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes voiceRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.7);opacity:0}}
        @keyframes voiceGlow{0%,100%{opacity:0}50%{opacity:1}}
        @keyframes vcWave{0%,100%{height:4px}50%{height:20px}}
      `}</style>

      {/* Call header */}
      <div className="pt-safe flex flex-col items-center pt-8 pb-4 px-4">
        <p className="text-slate-400 text-xs tracking-widest uppercase mb-1">CareerMap AI</p>
        <p className="text-white font-semibold text-sm">
          {selectedCareer ? selectedCareer.title : (lang === "hi" ? "Career Counselor" : "Career Counselor")}
        </p>
        <p className="text-slate-500 text-xs mt-1 tabular-nums">{formatDuration(duration)}</p>
      </div>

      {/* Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <CallAvatar state={callState} />
        <div className="text-center">
          <p className={`text-sm font-medium ${stateColor} transition-colors`}>{stateLabel}</p>
          <WaveBars active={callState === "ai_speaking"} />
        </div>

        {/* Live interim transcript */}
        {callState === "listening" && interimText && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2 max-w-xs w-full">
            <p className="text-orange-300 text-sm italic text-center">"{interimText}"</p>
          </div>
        )}
      </div>

      {/* Recent transcript */}
      <div className="px-4 pb-2 max-h-44 overflow-y-auto space-y-2">
        {turns.slice(-4).map((t, i) => (
          <div key={i} className={`flex gap-2 ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              t.role === "user"
                ? "bg-orange-500/20 text-orange-200 rounded-br-none"
                : "bg-indigo-600/20 text-indigo-100 rounded-bl-none"
            }`}>
              {t.text.length > 160 ? t.text.slice(0, 160) + "…" : t.text}
            </div>
          </div>
        ))}
        <div ref={turnsEndRef} />
      </div>

      {/* End call button */}
      <div className="flex flex-col items-center gap-4 pb-10 pt-4">
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
        <p className="text-slate-600 text-xs">
          {lang === "hi" ? "call खत्म करने के लिए दबाएं" : "call khatam karne ke liye dabaaein"}
        </p>
      </div>
    </div>
  );
}
