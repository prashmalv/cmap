"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, MapPin, TrendingUp, Target, BookOpen,
  ExternalLink, Bot, Search, Loader2, CheckCircle, AlertCircle
} from "lucide-react";
import { GapAnalysisPanel } from "@/components/gap-analysis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileStore } from "@/store/profile";
import { getCareerById, matchCareers, type CareerMatch } from "@/lib/career-engine";
import type { UserProfile } from "@/lib/career-engine";
import matrixData from "@/data/career-matrix.json";

export default function CareerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, selectCareer } = useProfileStore();
  const [match, setMatch] = useState<CareerMatch | null>(null);
  const [newsResult, setNewsResult] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  const id = params.id as string;
  const career = getCareerById(id);

  useEffect(() => {
    if (!career) { router.replace("/dashboard"); return; }
    selectCareer(id);
    if (profile) {
      const matches = matchCareers(profile as UserProfile);
      const found = matches.find((m) => m.career.id === id);
      setMatch(found ?? null);
    }
  }, [id, career, profile, selectCareer, router]);

  async function fetchLatestNews() {
    if (!career) return;
    setNewsLoading(true);
    setNewsResult(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(career.title + " latest notification exam 2025")}&careerId=${id}`);
      const data = await res.json();
      setNewsResult(data.result ?? data.error);
    } finally {
      setNewsLoading(false);
    }
  }

  if (!career) return null;

  const catInfo = (matrixData.categories as Record<string, { label: string; icon: string; color: string }>)[career.category];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-900 text-sm truncate">{career.title}</h1>
          </div>
          <Link href="/chat">
            <Button size="sm" className="text-xs">
              <Bot className="w-3.5 h-3.5" /> Ask AI
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div className="h-2" style={{ background: catInfo?.color ?? "#1D4ED8" }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{catInfo?.icon}</span>
                  <Badge variant="category">{catInfo?.label}</Badge>
                  {match && (
                    <Badge variant={match.eligibility === "eligible" ? "eligible" : "partial"}>
                      {match.eligibility === "eligible" ? (
                        <><CheckCircle className="w-3 h-3" /> Eligible</>
                      ) : (
                        <><AlertCircle className="w-3 h-3" /> Partial</>
                      )}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{career.title}</h2>
                {career.title_hi && <p className="text-slate-500 text-sm mb-3">{career.title_hi}</p>}
                <p className="text-slate-600 text-sm">{career.description}</p>
              </div>
              {match && (
                <div className="text-center shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {match.match_score}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Match</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 mb-1">Starting Salary</p>
                <p className="text-sm font-semibold text-green-700">{career.salary_range.entry}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Timeline</p>
                <p className="text-sm font-semibold text-slate-700">{career.timeline_to_enter}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Demand</p>
                <Badge variant={career.demand_level === "very_high" || career.demand_level === "high" ? "high" : "medium"}>
                  {career.demand_level.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Competition</p>
                <Badge variant={career.competitive_level === "very_high" || career.competitive_level === "high" ? "eligible" : "info"}>
                  {career.competitive_level.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gap Analysis */}
        {match?.gap_analysis && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <GapAnalysisPanel gap={match.gap_analysis} />
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Selection Process / Roadmap */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-700" /> Selection Process
              </h3>
              <ol className="space-y-3">
                {career.selection_process.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Growth Path */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" /> Growth Path
              </h3>
              <div className="space-y-2">
                {career.growth_path.map((level, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{
                      background: `hsl(${120 + i * 20}, 70%, 50%)`
                    }} />
                    <span className="text-sm text-slate-700">{level}</span>
                    {i < career.growth_path.length - 1 && (
                      <div className="flex-1 border-t border-dashed border-slate-200" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-700" /> Eligibility Criteria
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Age Limit</span>
                  <span className="font-medium text-slate-800">
                    {career.age_criteria.min}–{career.age_criteria.max} years
                  </span>
                </div>
                {career.age_criteria.relaxation && (
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                    <strong>Age Relaxation:</strong>{" "}
                    {Object.entries(career.age_criteria.relaxation)
                      .map(([k, v]) => `${k.toUpperCase()}: +${v}yr`)
                      .join(" • ")}
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Min Education</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {career.min_education.map((edu) => (
                      <Badge key={edu} variant="category" className="text-xs">
                        {matrixData.education_levels[edu as keyof typeof matrixData.education_levels]?.label ?? edu}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Job Locations</span>
                  <span className="font-medium text-slate-800 text-right max-w-[60%]">
                    {Array.isArray(career.job_locations) ? career.job_locations.join(", ") : career.job_locations}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exams */}
          {career.exams && career.exams.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" /> Exams to Clear
                </h3>
                <div className="space-y-3">
                  {career.exams.map((exam, i) => (
                    <div key={i} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="font-medium text-sm text-purple-900">{exam.name}</p>
                      <p className="text-xs text-purple-600 mt-0.5">
                        Conducted by: {exam.body} {exam.frequency ? `• ${exam.frequency}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Skills */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {career.skills_required.map((skill) => (
                <Badge key={skill} variant="info">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rajasthan relevance */}
        {"rajasthan_relevance" in career && career.rajasthan_relevance && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-800 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Rajasthan Connection
            </h3>
            <p className="text-sm text-orange-700">{String(career.rajasthan_relevance)}</p>
          </div>
        )}

        {/* Latest News */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-700" /> Latest News & Notifications
              </h3>
              <Button size="sm" variant="outline" onClick={fetchLatestNews} disabled={newsLoading}>
                {newsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Fetch Latest"}
              </Button>
            </div>
            {newsResult ? (
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                {newsResult}
                <p className="text-xs text-slate-400 mt-3 border-t border-slate-200 pt-2">
                  ⚠️ AI-generated info. Please verify from official websites.
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-6">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click Fetch Latest to get current exam notifications</p>
              </div>
            )}
            {career.official_website && (
              <a href={career.official_website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline mt-3">
                <ExternalLink className="w-3.5 h-3.5" /> Official Website: {career.official_website}
              </a>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3 pb-6">
          <Link href="/chat" className="flex-1">
            <Button size="lg" className="w-full">
              <Bot className="w-4 h-4" /> Ask AI About This Career
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
