"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
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

export function VoiceWidget({ language, onTranscript, lastAIMessage, isAILoading }: VoiceWidgetProps) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const spokenMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const SpeechRec = typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : null;
    setSupported(!!(SpeechRec && window.speechSynthesis));
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text).slice(0, 600);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = language === "hi" ? "hi-IN" : "en-IN";
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [language]);

  // Auto-speak new AI messages
  useEffect(() => {
    if (!lastAIMessage || isAILoading) return;
    if (lastAIMessage === spokenMessageRef.current) return;
    spokenMessageRef.current = lastAIMessage;
    speak(lastAIMessage);
  }, [lastAIMessage, isAILoading, speak]);

  function startListening() {
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
      if (final) {
        onTranscript(final.trim());
        setTranscript("");
      }
    };
    rec.onerror = () => { setListening(false); setTranscript(""); };
    rec.onend = () => { setListening(false); };
    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Transcript preview */}
      {transcript && (
        <span className="text-xs text-slate-500 max-w-[140px] truncate italic">"{transcript}"</span>
      )}

      {/* TTS stop button */}
      {speaking && (
        <button
          onClick={stopSpeaking}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          title="Stop speaking"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stop</span>
        </button>
      )}

      {/* Speaking indicator */}
      {speaking && !transcript && (
        <span className="flex items-center gap-1 text-xs text-purple-600">
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Speaking…</span>
        </span>
      )}

      {/* Mic button */}
      <button
        onClick={listening ? stopListening : startListening}
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
