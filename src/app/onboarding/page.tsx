"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { useProfileStore } from "@/store/profile";
import type { UserProfile } from "@/lib/career-engine";

type ScenarioPrefill = {
  age: string;
  education: string;
  experience_years: string;
  experience_domain: string;
  interests: string[];
  category: string;
};

const SCENARIO_PREFILLS: ScenarioPrefill[] = [
  {
    age: "22",
    education: "graduation_commerce",
    experience_years: "2",
    experience_domain: "Private sector job",
    interests: ["defense"],
    category: "defense",
  },
  {
    age: "16",
    education: "class_10",
    experience_years: "0",
    experience_domain: "",
    interests: ["aviation"],
    category: "aviation",
  },
  {
    age: "24",
    education: "graduation_engineering",
    experience_years: "0",
    experience_domain: "",
    interests: ["upsc", "govt"],
    category: "civil_services",
  },
  {
    age: "18",
    education: "class_12_arts",
    experience_years: "0",
    experience_domain: "",
    interests: ["hospitality"],
    category: "hospitality",
  },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setProfile } = useProfileStore();

  const scenarioParam = searchParams.get("scenario");
  const scenarioIdx = scenarioParam !== null ? parseInt(scenarioParam, 10) : -1;
  const prefill = scenarioIdx >= 0 && scenarioIdx < SCENARIO_PREFILLS.length
    ? SCENARIO_PREFILLS[scenarioIdx]
    : undefined;

  function handleComplete(profile: UserProfile) {
    setProfile(profile);
    router.push("/dashboard");
  }

  return <OnboardingWizard onComplete={handleComplete} prefill={prefill} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
