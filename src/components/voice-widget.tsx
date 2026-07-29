"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, VolumeX, Loader2 } from "lucide-react";
import type { Lang } from "@/lib/i18n";

// Web Speech API types (not in all TS dom libs)
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
}
interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void;
}
interface SpeechRecognitionConstructor { new (): ISpeechRecognition; }
declare global {
  interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor; }
}

interface VoiceWidgetProps {
  language: Lang;
  onTranscript: (text: string) => void;
  lastAIMessage: string | null;
  isAILoading: boolean;
  onGeneratePDF: () => void;
  pdfGenerating: boolean;
}

// Picks the most human-sounding voice available on this device
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const isHindi = lang === "hi-IN";

  // Priority order for Hindi
  const hindiOrder = [
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN" && v.name.toLowerCase().includes("swara"),    // Azure Swara — most human
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN" && v.name.toLowerCase().includes("google"),   // Google हिन्दी
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN" && v.name.toLowerCase().includes("female"),
    (v: SpeechSynthesisVoice) => v.lang === "hi-IN",
    (v: SpeechSynthesisVoice) => v.lang.startsWith("hi"),
  ];

  // Priority order for Hinglish/English — prefer Indian English female
  const engOrder = [
    (v: SpeechSynthesisVoice) => v.lang === "en-IN" && v.name.toLowerCase().includes("google"),   // Google Indian English
    (v: SpeechSynthesisVoice) => v.lang === "en-IN" && v.name.toLowerCase().includes("female"),
    (v: SpeechSynthesisVoice) => v.lang === "en-IN",
    (v: SpeechSynthesisVoice) => v.name === "Google UK English Female",
    (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes("female") && v.lang.startsWith("en"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google"),
  ];

  const order = isHindi ? hindiOrder : engOrder;
  for (const matcher of order) {
    const found = voices.find(matcher);
    if (found) return found;
  }
  return null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\|.*?\|/g, "")
    .replace(/[-_]{3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function useSpeech(language: Lang) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const spokenMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const SpeechRec = typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : null;
    setSupported(!!(SpeechRec && window.speechSynthesis));
  }, []);

  const speak = useCallback(async (text: string) => {
    window.speechSynthesis?.cancel();
    setSpeaking(true);
    const clean = stripMarkdown(text).slice(0, 600);

    // ── ElevenLabs path ────────────────────────────────────────────────────
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, lang: language }),
      });
      if (!res.ok) throw new Error("EL " + res.status);
      const buf = await res.arrayBuffer();
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(buf);
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      src.onended = () => { setSpeaking(false); try { ctx.close(); } catch {} };
      src.start(0);
      return;
    } catch {
      // fall through to Web Speech API
    }

    // ── Web Speech API fallback ────────────────────────────────────────────
    if (!window.speechSynthesis) { setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(clean);
    const langCode = language === "hi" ? "hi-IN" : "en-IN";
    utt.lang = langCode;
    const bestVoice = pickVoice(langCode);
    if (bestVoice) utt.voice = bestVoice;
    utt.rate = bestVoice ? 0.88 : 0.82;
    utt.pitch = 1.0;
    utt.volume = 1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const startListening = useCallback((onTranscript: (t: string) => void) => {
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = language === "hi" ? "hi-IN" : "en-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => { setListening(true); setTranscript(""); };
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final) { onTranscript(final.trim()); setTranscript(""); }
    };
    rec.onerror = () => { setListening(false); setTranscript(""); };
    rec.onend = () => { setListening(false); };
    recognitionRef.current = rec;
    rec.start();
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, speaking, listening, transcript, speak, stopSpeaking, startListening, stopListening, spokenMessageRef };
}

// ─── Inline CSS keyframes injected once ───────────────────────────────────────
const AVATAR_CSS = `
@keyframes cm-blink {
  0%,96%  { transform: scaleY(1); }
  98%     { transform: scaleY(0.05); }
  100%    { transform: scaleY(1); }
}
@keyframes cm-mouth-talk {
  0%,100% { d: path("M 38 62 Q 50 68 62 62"); }
  50%     { d: path("M 38 60 Q 50 72 62 60"); }
}
@keyframes cm-head-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-3px); }
}
@keyframes cm-glow-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.0); }
  50%     { box-shadow: 0 0 0 12px rgba(99,102,241,0.15); }
}
@keyframes cm-ring {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes cm-wave {
  0%,100% { height: 4px; }
  50%     { height: 16px; }
}`;

function injectAvatarCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cm-avatar-css")) return;
  const s = document.createElement("style");
  s.id = "cm-avatar-css";
  s.textContent = AVATAR_CSS;
  document.head.appendChild(s);
}

// ─── SVG Avatar Face ──────────────────────────────────────────────────────────
function AvatarFace({ speaking, listening, loading }: { speaking: boolean; listening: boolean; loading: boolean }) {
  useEffect(() => { injectAvatarCSS(); }, []);

  const headStyle: React.CSSProperties = speaking
    ? { animation: "cm-head-bob 0.35s ease-in-out infinite" }
    : {};

  // Mouth: animate open/close rapidly when speaking
  const mouthAnim: React.CSSProperties = speaking
    ? { animationName: "cm-mouth-talk", animationDuration: "0.3s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }
    : {};

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: 120, height: 120,
        animation: speaking ? "cm-glow-pulse 1s ease-in-out infinite" : undefined,
        borderRadius: "50%",
      }}
    >
      {/* Listening ring */}
      {listening && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-red-400" style={{ animation: "cm-ring 1s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full border-2 border-red-400" style={{ animation: "cm-ring 1s ease-out 0.4s infinite" }} />
        </>
      )}

      {/* Face circle */}
      <div style={headStyle}>
        <svg width="112" height="112" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="faceGrad" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </radialGradient>
            <radialGradient id="glowEye" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </radialGradient>
          </defs>

          {/* Face */}
          <circle cx="50" cy="50" r="46" fill="url(#faceGrad)" />

          {/* Shine */}
          <ellipse cx="35" cy="28" rx="12" ry="7" fill="white" opacity="0.12" />

          {/* Left eyebrow */}
          <path d="M 27 33 Q 33 29 39 31" stroke="#a5b4fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Right eyebrow */}
          <path d="M 61 31 Q 67 29 73 33" stroke="#a5b4fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Eyes (blink via scaleY) */}
          <g style={{ transformOrigin: "33px 42px", animation: "cm-blink 3.5s ease-in-out infinite" }}>
            <ellipse cx="33" cy="42" rx="7" ry="7" fill="white" opacity="0.9" />
            <circle cx="34" cy="43" r="4" fill="#1e1b4b" />
            <circle cx="35.5" cy="41.5" r="1.3" fill="white" opacity="0.8" />
          </g>
          <g style={{ transformOrigin: "67px 42px", animation: "cm-blink 3.5s ease-in-out 0.7s infinite" }}>
            <ellipse cx="67" cy="42" rx="7" ry="7" fill="white" opacity="0.9" />
            <circle cx="68" cy="43" r="4" fill="#1e1b4b" />
            <circle cx="69.5" cy="41.5" r="1.3" fill="white" opacity="0.8" />
          </g>

          {/* Nose dot */}
          <circle cx="50" cy="55" r="1.5" fill="#a5b4fc" opacity="0.6" />

          {/* Mouth */}
          {loading ? (
            /* Thinking: three bouncing dots */
            <>
              <circle cx="40" cy="66" r="3" fill="#e0e7ff" opacity="0.9">
                <animate attributeName="cy" values="66;62;66" dur="0.8s" begin="0s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="66" r="3" fill="#e0e7ff" opacity="0.9">
                <animate attributeName="cy" values="66;62;66" dur="0.8s" begin="0.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="66" r="3" fill="#e0e7ff" opacity="0.9">
                <animate attributeName="cy" values="66;62;66" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
              </circle>
            </>
          ) : speaking ? (
            /* Talking: mouth opens and closes */
            <ellipse cx="50" cy="66" rx="10" ry="0" fill="#e0e7ff" opacity="0.95" style={mouthAnim}>
              <animate attributeName="ry" values="1;6;1" dur="0.3s" repeatCount="indefinite" />
            </ellipse>
          ) : (
            /* Neutral smile */
            <path d="M 38 64 Q 50 72 62 64" stroke="#e0e7ff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── Sound wave bars (shown while speaking) ───────────────────────────────────
function SoundWave() {
  const bars = [0.4, 0.7, 1, 0.7, 0.5, 0.9, 0.6, 1, 0.7, 0.4];
  return (
    <div className="flex items-center gap-[3px] h-6">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-indigo-400"
          style={{
            height: 4,
            animation: `cm-wave 0.${5 + (i % 4)}s ease-in-out ${i * 0.06}s infinite`,
            maxHeight: 20,
          }}
        />
      ))}
    </div>
  );
}

// ─── Avatar Counselor panel ───────────────────────────────────────────────────
export function AvatarCounselor({ language, onTranscript, lastAIMessage, isAILoading }: Omit<VoiceWidgetProps, "onGeneratePDF" | "pdfGenerating">) {
  const { supported, speaking, listening, transcript, speak, stopSpeaking, startListening, stopListening, spokenMessageRef } = useSpeech(language);

  // Auto-speak new AI messages
  useEffect(() => {
    if (!lastAIMessage || isAILoading) return;
    if (lastAIMessage === spokenMessageRef.current) return;
    spokenMessageRef.current = lastAIMessage;
    speak(lastAIMessage);
  }, [lastAIMessage, isAILoading, speak, spokenMessageRef]);

  const stateLabel = isAILoading
    ? (language === "hi" ? "सोच रहा हूँ…" : language === "hinglish" ? "Soch raha hoon…" : "Thinking…")
    : speaking
    ? (language === "hi" ? "बोल रहा हूँ…" : language === "hinglish" ? "Bol raha hoon…" : "Speaking…")
    : listening
    ? (language === "hi" ? "सुन रहा हूँ…" : language === "hinglish" ? "Sun raha hoon…" : "Listening…")
    : (language === "hi" ? "पूछिए कुछ भी" : language === "hinglish" ? "Kuch bhi poochho" : "Ask me anything");

  if (!supported) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Avatar face */}
      <AvatarFace speaking={speaking} listening={listening} loading={isAILoading} />

      {/* Name + state label */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800">CareerMap AI</p>
        <p className={`text-xs mt-0.5 ${speaking ? "text-indigo-600" : listening ? "text-red-500" : isAILoading ? "text-amber-500" : "text-slate-400"}`}>
          {stateLabel}
        </p>
      </div>

      {/* Sound wave while speaking */}
      {speaking && <SoundWave />}

      {/* Transcript preview while listening */}
      {transcript && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 max-w-[200px]">
          <p className="text-xs text-blue-700 italic truncate">"{transcript}"</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-1">
        {speaking && (
          <button
            onClick={stopSpeaking}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5" /> Stop
          </button>
        )}
        <button
          onClick={listening ? stopListening : () => startListening(onTranscript)}
          disabled={isAILoading || speaking}
          className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-all ${
            listening
              ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-105"
              : isAILoading || speaking
              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
          }`}
        >
          {isAILoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {language === "hi" ? "प्रतीक्षा करें" : "Wait..."}</>
            : listening
            ? <><MicOff className="w-4 h-4" /> {language === "hi" ? "रोकें" : "Stop"}</>
            : <><Mic className="w-4 h-4" /> {language === "hi" ? "बोलें" : language === "hinglish" ? "Bolo" : "Speak"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Compact inline widget (used in chat input bar) ───────────────────────────
export function VoiceWidget({ language, onTranscript, lastAIMessage, isAILoading }: VoiceWidgetProps) {
  const { supported, speaking, listening, transcript, speak, stopSpeaking, startListening, stopListening, spokenMessageRef } = useSpeech(language);

  useEffect(() => {
    if (!lastAIMessage || isAILoading) return;
    if (lastAIMessage === spokenMessageRef.current) return;
    spokenMessageRef.current = lastAIMessage;
    speak(lastAIMessage);
  }, [lastAIMessage, isAILoading, speak, spokenMessageRef]);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {transcript && (
        <span className="text-xs text-slate-500 max-w-[140px] truncate italic">"{transcript}"</span>
      )}
      {speaking && (
        <button
          onClick={stopSpeaking}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stop</span>
        </button>
      )}
      <button
        onClick={listening ? stopListening : () => startListening(onTranscript)}
        disabled={isAILoading}
        title={listening ? "Stop listening" : "Speak your question"}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
          listening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
            : isAILoading
            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        }`}
      >
        {isAILoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : listening
          ? <MicOff className="w-4 h-4" />
          : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
}
