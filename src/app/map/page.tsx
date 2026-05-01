"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, LayoutGrid, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CareerFlowMap } from "@/components/career-flow-map";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useProfileStore } from "@/store/profile";
import { matchCareers, type CareerMatch } from "@/lib/career-engine";
import type { UserProfile } from "@/lib/career-engine";
import { useT } from "@/lib/i18n";
import matrixData from "@/data/career-matrix.json";

export default function MapPage() {
  const router = useRouter();
  const { profile, selectCareer, language } = useProfileStore();
  const tr = useT(language);
  const [matches, setMatches] = useState<CareerMatch[]>([]);

  useEffect(() => {
    if (!profile) { router.replace("/onboarding"); return; }
    setMatches(matchCareers(profile as UserProfile));
  }, [profile, router]);

  function handleSelectCareer(id: string) { selectCareer(id); router.push(`/career/${id}`); }
  function handleChatCareer(id: string) { selectCareer(id); router.push("/chat"); }

  if (!profile) return null;

  const eduLabel = matrixData.education_levels[profile.education as keyof typeof matrixData.education_levels]?.label ?? profile.education;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm">CareerMap AI</span>
            </Link>
            <span className="text-slate-400">›</span>
            <span className="text-sm text-slate-600 font-medium">
              {language === "hi" ? "करियर फ्लो मैप" : "Career Flow Map"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 hidden sm:block">
              {profile.name} • {profile.age}{language === "hi" ? "वर्ष" : "y"}
            </div>
            <LanguageSwitcher />
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="text-xs">
                <LayoutGrid className="w-3.5 h-3.5" /> {tr("map_card_view")}
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="sm" className="text-xs bg-blue-700 hover:bg-blue-800">
                <Bot className="w-3.5 h-3.5" /> AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{language === "hi" ? "संकेत:" : "Legend:"}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> {tr("map_legend_eligible")}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> {tr("map_legend_partial")}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-700 inline-block" /> {tr("map_legend_you")}</span>
          <span className="ml-auto text-slate-400">{tr("map_hint")}</span>
        </div>
      </div>

      <div className="flex-1" style={{ height: "calc(100vh - 112px)" }}>
        {matches.length > 0 ? (
          <CareerFlowMap
            matches={matches}
            profileName={profile.name}
            profileSubtitle={`${profile.age}${language === "hi" ? "वर्ष" : "y"} • ${eduLabel}`}
            onSelectCareer={handleSelectCareer}
            onChatCareer={handleChatCareer}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p>{tr("map_loading")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
