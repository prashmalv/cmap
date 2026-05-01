"use client";
import { useProfileStore } from "@/store/profile";
import { LANG_LABELS, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["hi", "hinglish", "en"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useProfileStore();

  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
            language === lang
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {LANG_LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
