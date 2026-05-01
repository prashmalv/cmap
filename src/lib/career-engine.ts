import matrixData from "@/data/career-matrix.json";

export type EducationLevel = string;

export interface UserProfile {
  name: string;
  age: number;
  education: EducationLevel;
  experience_years: number;
  experience_domain?: string;
  interests: string[];
  location?: string;
  category?: string;
  gender?: "male" | "female" | "other";
  caste_category?: "general" | "obc" | "sc" | "st" | "pwd";
}

export interface CareerMatch {
  career: (typeof matrixData.careers)[0];
  eligibility: "eligible" | "partial" | "ineligible";
  eligibility_reason: string;
  match_score: number;
  missing_requirements: string[];
  action_steps: string[];
}

const EDU_ORDER: Record<string, number> = Object.fromEntries(
  Object.entries(matrixData.education_levels).map(([k, v]) => [k, v.order])
);

function getEduOrder(level: string): number {
  return EDU_ORDER[level] ?? 0;
}

function isEligibleByEducation(
  userEdu: string,
  requiredLevels: string[]
): boolean {
  const userOrder = getEduOrder(userEdu);
  return requiredLevels.some((req) => {
    if (req === "graduation_any") {
      return userOrder >= 5;
    }
    if (req === "postgrad_any") {
      return userOrder >= 6;
    }
    if (req === userEdu) return true;
    // ITI/diploma can substitute for some graduation stream requirements
    if (userEdu === "iti" && req === "diploma") return true;
    return getEduOrder(req) <= userOrder;
  });
}

function isEligibleByAge(
  userAge: number,
  criteria: { min: number; max: number; relaxation?: Record<string, number> },
  casteCategory?: string
): boolean {
  let maxAge = criteria.max;
  if (casteCategory && criteria.relaxation) {
    const relax = criteria.relaxation[casteCategory] ?? 0;
    maxAge += relax;
  }
  return userAge >= criteria.min && userAge <= maxAge;
}

function computeMatchScore(career: (typeof matrixData.careers)[0], profile: UserProfile): number {
  let score = 0;

  if (profile.interests.some((i) => career.tags.includes(i.toLowerCase()))) {
    score += 30;
  }

  if (career.demand_level === "very_high") score += 20;
  else if (career.demand_level === "high") score += 15;
  else if (career.demand_level === "medium") score += 10;

  if (career.competitive_level === "low") score += 15;
  else if (career.competitive_level === "medium") score += 10;

  if (profile.location?.toLowerCase().includes("rajasthan") && career.rajasthan_relevance) {
    score += 10;
  }

  if (profile.category === career.category) score += 20;

  return Math.min(score, 100);
}

export function matchCareers(profile: UserProfile): CareerMatch[] {
  return matrixData.careers
    .map((career) => {
      const eduEligible = isEligibleByEducation(
        profile.education,
        career.min_education
      );
      const ageEligible = isEligibleByAge(
        profile.age,
        career.age_criteria as { min: number; max: number; relaxation?: Record<string, number> },
        profile.caste_category
      );

      const missing: string[] = [];
      let eligibility: CareerMatch["eligibility"] = "eligible";
      const steps: string[] = [];

      if (!eduEligible) {
        missing.push(`Required education: ${career.min_education.join(" or ")}`);
        eligibility = "partial";
        steps.push(`Complete required education: ${career.min_education[0]}`);
      }

      if (!ageEligible) {
        const { min, max } = career.age_criteria;
        if (profile.age < min) {
          missing.push(`Minimum age: ${min} years`);
          eligibility = "partial";
          steps.push(`You can apply after ${min} years of age`);
        } else {
          missing.push(`Age limit exceeded: max ${max} years`);
          eligibility = "ineligible";
        }
      }

      if (eligibility === "eligible") {
        steps.push(...(career.selection_process ?? []).slice(0, 3));
      }

      const reason =
        eligibility === "eligible"
          ? "You meet all basic eligibility criteria"
          : eligibility === "partial"
          ? `Some requirements pending: ${missing.join(", ")}`
          : `Not eligible: ${missing.join(", ")}`;

      return {
        career,
        eligibility,
        eligibility_reason: reason,
        match_score: eligibility === "ineligible" ? 0 : computeMatchScore(career, profile),
        missing_requirements: missing,
        action_steps: steps,
      } as CareerMatch;
    })
    .filter((m) => m.eligibility !== "ineligible")
    .sort((a, b) => b.match_score - a.match_score);
}

export function getCareerById(id: string) {
  return matrixData.careers.find((c) => c.id === id) ?? null;
}

export function getCategories() {
  return matrixData.categories;
}

export function getEducationLevels() {
  return matrixData.education_levels;
}

export function filterByCategory(careers: CareerMatch[], category: string) {
  if (!category || category === "all") return careers;
  return careers.filter((c) => c.career.category === category);
}

export function buildFlowMapData(matches: CareerMatch[]) {
  const categoryGroups: Record<string, CareerMatch[]> = {};

  matches.forEach((m) => {
    if (!categoryGroups[m.career.category]) categoryGroups[m.career.category] = [];
    categoryGroups[m.career.category].push(m);
  });

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Root node
  nodes.push({
    id: "root",
    type: "root",
    label: "Your Profile",
    x: 0,
    y: 0,
  });

  const categories = Object.keys(categoryGroups);
  const catSpacing = 300;
  const careerSpacing = 150;

  categories.forEach((cat, ci) => {
    const catX = (ci - Math.floor(categories.length / 2)) * catSpacing;
    const catInfo = (matrixData.categories as Record<string, { label: string; icon: string; color: string }>)[cat];
    const catNodeId = `cat-${cat}`;

    nodes.push({
      id: catNodeId,
      type: "category",
      label: catInfo?.label ?? cat,
      icon: catInfo?.icon,
      color: catInfo?.color,
      x: catX,
      y: 200,
    });

    edges.push({ id: `e-root-${cat}`, source: "root", target: catNodeId });

    categoryGroups[cat].slice(0, 5).forEach((match, ji) => {
      const careerX = catX + (ji - Math.floor(Math.min(categoryGroups[cat].length, 5) / 2)) * careerSpacing;
      const careerNodeId = `career-${match.career.id}`;

      nodes.push({
        id: careerNodeId,
        type: "career",
        label: match.career.title,
        eligibility: match.eligibility,
        matchScore: match.match_score,
        careerId: match.career.id,
        x: careerX,
        y: 450,
      });

      edges.push({ id: `e-${cat}-${match.career.id}`, source: catNodeId, target: careerNodeId });
    });
  });

  return { nodes, edges };
}

export interface FlowNode {
  id: string;
  type: "root" | "category" | "career";
  label: string;
  icon?: string;
  color?: string;
  eligibility?: string;
  matchScore?: number;
  careerId?: string;
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}
