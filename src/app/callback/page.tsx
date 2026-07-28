"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, ChevronLeft, PhoneOff, Loader2 } from "lucide-react";
// CheckCircle, Clock removed — no longer used after call screen redesign
import { useProfileStore } from "@/store/profile";

export default function CallbackPage() {
  const { profile, language } = useProfileStore();
  const router = useRouter();
  const lang = language;
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState("");
  const [prefLang, setPrefLang] = useState<"hi" | "en">(lang === "hi" ? "hi" : "en");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [hungUp, setHungUp] = useState(false);

  const hi = lang === "hi";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || phone.length < 10) return;
    setLoading(true);
    try {
      await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, language: prefLang, topic }),
      });
    } catch { /* still show calling screen */ }
    setLoading(false);
    setCalling(true);
  }

  function hangUp() {
    setHungUp(true);
    setTimeout(() => router.push("/dashboard"), 1800);
  }

  // ── Calling screen ──────────────────────────────────────────────────────
  if (calling) {
    const displayPhone = "+91 " + phone.replace(/(\d{5})(\d{5})/, "$1 $2");
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-between py-16 px-6">
        <style>{`
          @keyframes cbRing{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.9);opacity:0}}
          @keyframes cbPulse{0%,100%{opacity:1}50%{opacity:.4}}
        `}</style>

        {/* Top: number info */}
        <div className="text-center pt-8">
          <p className="text-slate-400 text-xs tracking-widest uppercase mb-3">
            {hungUp ? (hi ? "कॉल समाप्त" : "Call Khatam") : (hi ? "कॉल हो रही है…" : "Calling…")}
          </p>
          <p className="text-white text-3xl font-light tracking-wide">{displayPhone}</p>
          {name && <p className="text-slate-400 text-sm mt-1">{name}</p>}
        </div>

        {/* Center: animated ring + icon */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {!hungUp && (<>
            <div className="absolute inset-0 rounded-full border border-green-400/40"
              style={{ animation: "cbRing 1.6s ease-out infinite" }} />
            <div className="absolute inset-0 rounded-full border border-green-400/30"
              style={{ animation: "cbRing 1.6s ease-out 0.6s infinite" }} />
            <div className="absolute inset-0 rounded-full border border-green-400/20"
              style={{ animation: "cbRing 1.6s ease-out 1.1s infinite" }} />
          </>)}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-500 ${
            hungUp ? "bg-slate-700" : "bg-green-600"
          }`}>
            {hungUp
              ? <PhoneOff className="w-9 h-9 text-slate-300" />
              : <Phone className="w-9 h-9 text-white" style={{ animation: "cbPulse 1.4s ease-in-out infinite" }} />
            }
          </div>
        </div>

        {/* Bottom: hang up button */}
        <div className="flex flex-col items-center gap-4">
          {!hungUp ? (
            <>
              <button
                onClick={hangUp}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <p className="text-slate-600 text-xs">
                {hi ? "कॉल काटने के लिए दबाएं" : "Call kaatne ke liye dabaaein"}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">
              {hi ? "Dashboard पर जा रहे हैं…" : "Dashboard pe ja rahe hain…"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
          </Link>
          <h1 className="font-semibold text-slate-900 text-sm">
            {hi ? "Call Request" : "Call Request"}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        <>
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {hi ? "हम आपको Call करेंगे" : "Hum Aapko Call Karenge"}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                {hi
                  ? "अपना नंबर दें। हमारा AI career counselor Hindi में आपसे personally बात करेगा।"
                  : "Apna number dein. Hamara AI career counselor Hinglish mein aapse personally baat karega."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {hi ? "नाम" : "Naam"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={hi ? "आपका नाम" : "Aapka naam"}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {hi ? "मोबाइल नंबर *" : "Mobile Number *"}
                </label>
                <div className="flex gap-2">
                  <div className="px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {hi ? "भाषा preference" : "Language Preference"}
                </label>
                <div className="flex gap-3">
                  {(["hi", "en"] as const).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPrefLang(l)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        prefLang === l
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {l === "hi" ? "हिंदी" : "Hinglish"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {hi ? "किस career के बारे में बात करनी है?" : "Kis career ke baare mein baat karni hai?"}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={hi ? "जैसे: RPSC, Teacher, Police, IAS..." : "Jaise: RPSC, Teacher, Police, IAS..."}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  : <><Phone className="w-4 h-4" /> {hi ? "Callback Request करें" : "Callback Request Karein"}</>}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-slate-400 text-xs mb-3">
                {hi ? "या अभी directly AI से बात करें" : "Ya abhi directly AI se baat karein"}
              </p>
              <Link href="/voice"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
                <Phone className="w-4 h-4" />
                {hi ? "In-App Voice Call" : "In-App Voice Call"}
              </Link>
            </div>
        </>
      </div>
    </div>
  );
}
