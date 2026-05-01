"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Bot, Network, Filter, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CareerCard } from "@/components/career-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useProfileStore } from "@/store/profile";
import { matchCareers, filterByCategory, getCategories, type CareerMatch } from "@/lib/career-engine";
import type { UserProfile } from "@/lib/career-engine";
import { useT } from "@/lib/i18n";
import matrixData from "@/data/career-matrix.json";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, selectCareer, language } = useProfileStore();
  const tr = useT(language);
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      router.replace("/onboarding");
      return;
    }
    const results = matchCareers(profile as UserProfile);
    setMatches(results);
    setIsLoading(false);
  }, [profile, router]);

  const categories = getCategories();

  const filtered = useMemo(() => {
    let result = filterByCategory(matches, selectedCategory);
    if (eligibilityFilter !== "all") {
      result = result.filter((m) => m.eligibility === eligibilityFilter);
    }
    return result;
  }, [matches, selectedCategory, eligibilityFilter]);

  const eligibleCount = matches.filter((m) => m.eligibility === "eligible").length;
  const partialCount = matches.filter((m) => m.eligibility === "partial").length;

  function handleSelectCareer(id: string) {
    selectCareer(id);
    router.push(`/career/${id}`);
  }

  function handleChatCareer(id: string) {
    selectCareer(id);
    router.push("/chat");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{tr("dash_loading")}</p>
        </div>
      </div>
    );
  }

  const eduLabel = matrixData.education_levels[profile?.education as keyof typeof matrixData.education_levels]?.label ?? profile?.education;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">CareerMap AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/map">
              <Button size="sm" variant="outline" className="text-xs">
                <Network className="w-3.5 h-3.5" /> {tr("dash_visual_map")}
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="sm" className="text-xs bg-blue-700 hover:bg-blue-800">
                <Bot className="w-3.5 h-3.5" /> AI
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="ghost" className="text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile banner */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-2xl p-5 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{tr("dash_greeting")} {profile.name}! 👋</h2>
                <p className="text-blue-200 text-sm">
                  {profile.age} {language === "hi" ? "वर्ष" : "yrs"} • {eduLabel}
                  {profile.experience_years > 0 ? ` • ${profile.experience_years} ${language === "hi" ? "वर्ष अनुभव" : "yrs exp"}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-300">{eligibleCount}</div>
                <div className="text-xs text-blue-200">{tr("dash_eligible")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-300">{partialCount}</div>
                <div className="text-xs text-blue-200">{tr("dash_partial")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{matches.length}</div>
                <div className="text-xs text-blue-200">{tr("dash_total")}</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-20">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700 text-sm">
                  {language === "hi" ? "फ़िल्टर" : "Filters"}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  {language === "hi" ? "पात्रता" : "Eligibility"}
                </p>
                {(["all", "eligible", "partial"] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEligibilityFilter(e)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition-colors ${
                      eligibilityFilter === e ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {e === "all" ? tr("dash_filter_all") : e === "eligible" ? tr("dash_filter_eligible") : tr("dash_filter_partial")}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  {language === "hi" ? "क्षेत्र" : "Category"}
                </p>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition-colors ${
                    selectedCategory === "all" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tr("dash_all_cats")}
                </button>
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition-colors ${
                      selectedCategory === key ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Career cards grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                {filtered.length} {tr("dash_found")}
              </h3>
              <Link href="/map">
                <Button variant="outline" size="sm" className="text-xs">
                  <Network className="w-3.5 h-3.5" /> {tr("dash_visual_map")}
                </Button>
              </Link>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">🔍</div>
                <p>{tr("dash_no_results")}</p>
                <Button
                  variant="outline" size="sm" className="mt-4"
                  onClick={() => { setSelectedCategory("all"); setEligibilityFilter("all"); }}
                >
                  {tr("dash_clear_filters")}
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((match, i) => (
                  <CareerCard
                    key={match.career.id}
                    match={match}
                    onSelect={handleSelectCareer}
                    onChat={handleChatCareer}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
