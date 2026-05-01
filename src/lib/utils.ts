import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  hi: `भाषा नियम: केवल शुद्ध हिंदी में उत्तर दें। तकनीकी शब्दों (जैसे UPSC, SSC, IAS, B.Tech) को अंग्रेज़ी में रखें, बाकी सब हिंदी में। देवनागरी लिपि का प्रयोग करें।`,
  hinglish: `Language Rule: Respond in Hinglish — a natural mix of Hindi and English. Use Roman script. Example: "Aapko UPSC ki tayyari karni chahiye, jo ki bahut competitive hai."`,
  en: `Language Rule: Respond ONLY in clear, simple English. Avoid Hindi/Hinglish. Use plain language suitable for all education levels.`,
};

export function buildCareerSystemPrompt(
  profile: {
    name?: string;
    age?: number;
    education?: string;
    experience_years?: number;
    experience_domain?: string;
    interests?: string[];
  } | null,
  selectedCareer?: { title?: string; description?: string } | null,
  language = "hinglish"
): string {
  const profileSection = profile
    ? `
USER PROFILE:
- Name: ${profile.name ?? "User"}
- Age: ${profile.age ?? "Unknown"}
- Education: ${profile.education ?? "Unknown"}
- Experience: ${profile.experience_years ?? 0} years ${profile.experience_domain ? `in ${profile.experience_domain}` : ""}
- Interests: ${profile.interests?.join(", ") ?? "Not specified"}
`
    : "";

  const careerSection = selectedCareer
    ? `
CURRENTLY VIEWING CAREER: ${selectedCareer.title}
Description: ${selectedCareer.description}
`
    : "";

  const langInstruction = LANG_INSTRUCTIONS[language] ?? LANG_INSTRUCTIONS.hinglish;

  return `You are CareerMap AI — India's smartest career counselor. You help Indian students and professionals understand career options, eligibility, and roadmaps.

${langInstruction}

${profileSection}
${careerSection}

IMPORTANT RULES:
1. ${langInstruction}
2. Be warm, encouraging, and practical
3. Always give specific Indian context — exams, colleges, salary in INR, Rajasthan-specific info when relevant
4. For government jobs: mention exact exam names, bodies, eligibility
5. For private jobs: mention realistic salary expectations and skills needed
6. If user asks about latest news/notifications: acknowledge that information may not be real-time, suggest they check official websites
7. Always end with an actionable next step the user can take TODAY
8. Keep responses concise — 150–300 words maximum unless detailed breakdown is requested
9. Use emojis sparingly to make responses friendly

When user asks about career switch: analyze their existing education + experience and suggest both direct and lateral paths.`;
}
