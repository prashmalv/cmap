"use client";
import Link from "next/link";
import { MapPin, LayoutGrid, Network, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useProfileStore } from "@/store/profile";
import { getCareerById } from "@/lib/career-engine";

export default function ChatPage() {
  const { profile, selectedCareerId, selectCareer, language } = useProfileStore();
  const selectedCareer = selectedCareerId ? getCareerById(selectedCareerId) : null;
  const greeting = language === "hi" ? "नमस्ते," : "Namaste,";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">CareerMap AI</span>
              {profile && (
                <span className="text-xs text-slate-400 ml-2">{greeting} {profile.name}!</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {selectedCareer && (
              <button
                onClick={() => selectCareer(null)}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
              >
                ✕ {selectedCareer.title.slice(0, 18)}…
              </button>
            )}
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="text-xs">
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/map">
              <Button size="sm" variant="outline" className="text-xs">
                <Network className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto bg-white shadow-sm" style={{ height: "calc(100vh - 56px)" }}>
        <ChatInterface />
      </div>
    </div>
  );
}
