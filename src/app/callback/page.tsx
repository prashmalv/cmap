"use client";
import { useState } from "react";
import Link from "next/link";
import { Phone, ChevronLeft, CheckCircle, Loader2, Clock } from "lucide-react";
import { useProfileStore } from "@/store/profile";

export default function CallbackPage() {
  const { profile, language } = useProfileStore();
  const lang = language;
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState("");
  const [prefLang, setPrefLang] = useState<"hi" | "en">(lang === "hi" ? "hi" : "en");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show confirmation even if network hiccup
    } finally {
      setLoading(false);
    }
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
            {hi ? "AI Callback Request" : "AI Callback Request"}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center py-12 gap-5">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {hi ? "Request दर्ज हो गई!" : "Request Register Ho Gayi!"}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                {hi
                  ? `हम जल्द ही ${phone} पर आपको call करेंगे। आमतौर पर 24 घंटे के अंदर callback आती है।`
                  : `Hum jald hi ${phone} pe aapko call karenge. Aamtaur par 24 ghante ke andar callback aati hai.`}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <Clock className="w-4 h-4 shrink-0" />
              {hi ? "अनुमानित समय: 24 घंटे के भीतर" : "Estimated time: 24 ghante ke andar"}
            </div>
            <div className="flex gap-3 mt-2">
              <Link href="/voice"
                className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                {hi ? "अभी Voice Call करें" : "Abhi Voice Call Karein"}
              </Link>
              <Link href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                {hi ? "Dashboard" : "Dashboard"}
              </Link>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
