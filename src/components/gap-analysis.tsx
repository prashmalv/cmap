"use client";
import { CheckCircle, AlertCircle, XCircle, Clock, GraduationCap, User, Lightbulb } from "lucide-react";
import type { GapAnalysis } from "@/lib/career-engine";

interface GapBadgeProps {
  gap: GapAnalysis;
}

export function GapFeasibilityBadge({ gap }: GapBadgeProps) {
  const icons = {
    ready:        <CheckCircle className="w-3 h-3" />,
    achievable:   <Clock className="w-3 h-3" />,
    long_journey: <AlertCircle className="w-3 h-3" />,
    not_feasible: <XCircle className="w-3 h-3" />,
  };
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: gap.feasibility_color + "18", color: gap.feasibility_color }}
    >
      {icons[gap.feasibility]}
      {gap.feasibility_label}
    </span>
  );
}

interface GapCardProps {
  gap: GapAnalysis;
  compact?: boolean;
}

export function GapAnalysisPanel({ gap, compact = false }: GapCardProps) {
  if (compact) {
    return (
      <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: gap.feasibility_color + "40" }}>
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ background: gap.feasibility_color + "12" }}
        >
          <GapFeasibilityBadge gap={gap} />
          {gap.gap_years > 0 && (
            <span className="text-[10px] text-slate-400">{gap.gap_years.toFixed(1)} yr gap</span>
          )}
        </div>

        {(gap.education_gap.has_gap || !gap.age_status.ok) && (
          <div className="px-3 py-2 space-y-1.5 bg-white">
            {gap.education_gap.has_gap && (
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <span className="line-through text-slate-400">{gap.education_gap.current_label}</span>
                  {" → "}
                  <span className="font-medium text-slate-700">{gap.education_gap.required_label}</span>
                  <span className="text-slate-400"> (~{gap.education_gap.years_to_close.toFixed(1)} yrs)</span>
                </span>
              </div>
            )}
            {!gap.age_status.ok && (
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{gap.age_status.message}</span>
              </div>
            )}
          </div>
        )}

        {gap.feasibility === "ready" && (
          <div className="px-3 py-2 bg-white">
            <div className="flex flex-wrap gap-1">
              {gap.skills_to_acquire.slice(0, 3).map((s) => (
                <span key={s} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full panel for detail page
  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: gap.feasibility_color + "50" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: gap.feasibility_color + "12" }}>
        <div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Gap Analysis & Feasibility</h3>
          <GapFeasibilityBadge gap={gap} />
        </div>
        {gap.gap_years > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: gap.feasibility_color }}>{gap.gap_years.toFixed(1)}</div>
            <div className="text-xs text-slate-400">yrs to bridge</div>
          </div>
        )}
      </div>

      <div className="bg-white p-5 space-y-5">
        {/* Education */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">Education</span>
            {gap.education_gap.has_gap
              ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Gap</span>
              : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Met</span>
            }
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${gap.education_gap.has_gap ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {gap.education_gap.current_label}
            </span>
            <span className="text-slate-300">→</span>
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
              {gap.education_gap.required_label} required
            </span>
          </div>
          {gap.education_gap.has_gap && (
            <div className="mt-2 text-xs text-slate-500 flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>{gap.education_gap.next_step} <span className="text-amber-600 font-medium">(~{gap.education_gap.years_to_close.toFixed(1)} yrs)</span></span>
            </div>
          )}
        </div>

        {/* Age */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-slate-700">Age Eligibility</span>
            {gap.age_status.ok
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Ok</span>
              : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Gap</span>
            }
          </div>
          <p className="text-xs text-slate-600">{gap.age_status.message}</p>
        </div>

        {/* Skills to develop */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-slate-700">Skills to Develop</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gap.skills_to_acquire.map((skill) => (
              <span key={skill} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: gap.feasibility_color + "10" }}>
          <span className="text-base mt-0.5">💡</span>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: gap.feasibility_color }}>Recommendation</p>
            <p className="text-xs text-slate-700">{gap.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
