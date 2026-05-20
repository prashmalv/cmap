"use client";
import { motion } from "framer-motion";
import { MapPin, Clock, TrendingUp, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { CareerMatch } from "@/lib/career-engine";
import { useProfileStore } from "@/store/profile";
import { useT } from "@/lib/i18n";
import matrixData from "@/data/career-matrix.json";
import { GapAnalysisPanel } from "./gap-analysis";

interface CareerCardProps {
  match: CareerMatch;
  onSelect: (id: string) => void;
  onChat: (id: string) => void;
  index: number;
}

export function CareerCard({ match, onSelect, onChat, index }: CareerCardProps) {
  const { language } = useProfileStore();
  const tr = useT(language);
  const { career, eligibility, match_score } = match;
  const catInfo = (matrixData.categories as Record<string, { label: string; icon: string; color: string }>)[career.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200 border-l-4"
        style={{ borderLeftColor: catInfo?.color ?? "#1D4ED8" }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-lg">{catInfo?.icon}</span>
                <Badge variant="category">{catInfo?.label}</Badge>
                <Badge variant={eligibility === "eligible" ? "eligible" : "partial"}>
                  {eligibility === "eligible" ? (
                    <><CheckCircle className="w-3 h-3" /> {tr("card_eligible")}</>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> {tr("card_partial")}</>
                  )}
                </Badge>
              </div>

              <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">
                {language === "hi" && career.title_hi ? career.title_hi : career.title}
              </h3>
              {language !== "hi" && career.title_hi && (
                <p className="text-xs text-slate-400 mb-1">{career.title_hi}</p>
              )}

              <p className="text-xs text-slate-600 line-clamp-2 mb-3">{career.description}</p>

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  {career.salary_range.entry}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  {career.timeline_to_enter}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  {Array.isArray(career.job_locations) ? career.job_locations[0] : career.job_locations}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-sm shadow">
                {match_score}
              </div>
              <span className="text-[10px] text-slate-400">Match</span>
            </div>
          </div>

          {match.gap_analysis && (
            <GapAnalysisPanel gap={match.gap_analysis} compact />
          )}

          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="default" className="flex-1 text-xs bg-blue-700 hover:bg-blue-800" onClick={() => onSelect(career.id)}>
              {tr("card_view_roadmap")} <ChevronRight className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => onChat(career.id)}>
              {tr("card_ask_ai")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
