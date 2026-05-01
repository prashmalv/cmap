"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle, User, GraduationCap, Briefcase, Heart, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LanguageSwitcher } from "./language-switcher";
import { useProfileStore } from "@/store/profile";
import { useT } from "@/lib/i18n";
import type { UserProfile } from "@/lib/career-engine";

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
  prefill?: {
    age?: string;
    education?: string;
    experience_years?: string;
    experience_domain?: string;
    interests?: string[];
    category?: string;
  };
}

const EDUCATION_OPTIONS = [
  { value: "class_10", label_hi: "10वीं पास (मैट्रिक/SSC)", label_hinglish: "10th Pass (Matric/SSC)", label_en: "10th Pass (Matric/SSC)" },
  { value: "class_12_pcm", label_hi: "12वीं - विज्ञान (PCM)", label_hinglish: "12th - Science (PCM)", label_en: "12th - Science (PCM)" },
  { value: "class_12_pcb", label_hi: "12वीं - विज्ञान (PCB)", label_hinglish: "12th - Science (PCB)", label_en: "12th - Science (PCB)" },
  { value: "class_12_commerce", label_hi: "12वीं - वाणिज्य", label_hinglish: "12th - Commerce", label_en: "12th - Commerce" },
  { value: "class_12_arts", label_hi: "12वीं - कला/मानविकी", label_hinglish: "12th - Arts/Humanities", label_en: "12th - Arts/Humanities" },
  { value: "iti", label_hi: "आईटीआई (औद्योगिक प्रशिक्षण)", label_hinglish: "ITI (Industrial Training)", label_en: "ITI (Industrial Training)" },
  { value: "diploma", label_hi: "डिप्लोमा (पॉलिटेक्निक)", label_hinglish: "Diploma (Polytechnic)", label_en: "Diploma (Polytechnic)" },
  { value: "graduation_engineering", label_hi: "B.Tech / B.E (इंजीनियरिंग)", label_hinglish: "B.Tech / B.E (Engineering)", label_en: "B.Tech / B.E (Engineering)" },
  { value: "graduation_medical", label_hi: "MBBS / BDS / BAMS", label_hinglish: "MBBS / BDS / BAMS", label_en: "MBBS / BDS / BAMS" },
  { value: "graduation_science", label_hi: "B.Sc (विज्ञान)", label_hinglish: "B.Sc (Science)", label_en: "B.Sc (Science)" },
  { value: "graduation_commerce", label_hi: "B.Com (वाणिज्य)", label_hinglish: "B.Com (Commerce)", label_en: "B.Com (Commerce)" },
  { value: "graduation_arts", label_hi: "BA (कला/मानविकी)", label_hinglish: "BA (Arts/Humanities)", label_en: "BA (Arts/Humanities)" },
  { value: "graduation_law", label_hi: "LLB / BA LLB", label_hinglish: "LLB / BA LLB", label_en: "LLB / BA LLB" },
  { value: "graduation_management", label_hi: "BBA / BMS (प्रबंधन)", label_hinglish: "BBA / BMS (Management)", label_en: "BBA / BMS (Management)" },
  { value: "graduation_hotel_mgmt", label_hi: "होटल मैनेजमेंट", label_hinglish: "Hotel Management", label_en: "Hotel Management" },
  { value: "graduation_it", label_hi: "BCA / B.Sc CS / IT", label_hinglish: "BCA / B.Sc CS / IT", label_en: "BCA / B.Sc CS / IT" },
  { value: "graduation_pharma", label_hi: "B.Pharm (फार्मेसी)", label_hinglish: "B.Pharm (Pharmacy)", label_en: "B.Pharm (Pharmacy)" },
  { value: "graduation_nursing", label_hi: "B.Sc नर्सिंग / GNM", label_hinglish: "B.Sc Nursing / GNM", label_en: "B.Sc Nursing / GNM" },
  { value: "graduation_education", label_hi: "B.Ed (शिक्षा)", label_hinglish: "B.Ed (Education)", label_en: "B.Ed (Education)" },
  { value: "graduation_agriculture", label_hi: "B.Sc कृषि", label_hinglish: "B.Sc Agriculture", label_en: "B.Sc Agriculture" },
  { value: "graduation_ca", label_hi: "CA (चार्टर्ड अकाउंटेंट)", label_hinglish: "CA (Chartered Accountant)", label_en: "CA (Chartered Accountant)" },
  { value: "graduation_any", label_hi: "अन्य स्नातक", label_hinglish: "Other Graduation", label_en: "Other Graduation" },
  { value: "postgrad_any", label_hi: "स्नातकोत्तर (PG)", label_hinglish: "Post Graduation (PG)", label_en: "Post Graduation (PG)" },
];

const INTEREST_OPTIONS_HI = ["सरकारी नौकरी", "UPSC", "रक्षा", "बैंकिंग", "आईटी", "स्वास्थ्य", "शिक्षण", "कानून", "विमानन", "आतिथ्य", "मीडिया", "डिज़ाइन", "उद्यमिता", "अनुसंधान", "कृषि", "वित्त", "रेलवे"];
const INTEREST_OPTIONS_HL = ["govt", "upsc", "defense", "banking", "it", "healthcare", "teaching", "law", "aviation", "hospitality", "media", "design", "entrepreneurship", "research", "agriculture", "finance", "railways"];
const INTEREST_VALUES = ["govt", "upsc", "defense", "banking", "it", "healthcare", "teaching", "law", "aviation", "hospitality", "media", "design", "entrepreneurship", "research", "agriculture", "finance", "railways"];

const CATEGORY_OPTIONS_HI = [
  { value: "", label: "कोई भी क्षेत्र" }, { value: "civil_services", label: "🏛️ सिविल सेवाएं" },
  { value: "defense", label: "⚔️ रक्षा" }, { value: "banking", label: "🏦 बैंकिंग" },
  { value: "railways", label: "🚂 रेलवे" }, { value: "teaching", label: "📚 शिक्षण" },
  { value: "it_tech", label: "💻 IT और टेक्नोलॉजी" }, { value: "healthcare", label: "🏥 स्वास्थ्य सेवा" },
  { value: "aviation", label: "✈️ विमानन" }, { value: "hospitality", label: "🏨 आतिथ्य" },
  { value: "legal", label: "⚖️ कानून" }, { value: "finance_accounting", label: "📊 वित्त/CA" },
  { value: "state_govt_rj", label: "🏰 राजस्थान सरकार" }, { value: "police", label: "👮 पुलिस" },
  { value: "psu", label: "🏭 PSU/सरकारी उद्यम" },
];
const CATEGORY_OPTIONS_HL = [
  { value: "", label: "Koi Bhi Field" }, { value: "civil_services", label: "🏛️ Civil Services" },
  { value: "defense", label: "⚔️ Defense" }, { value: "banking", label: "🏦 Banking" },
  { value: "railways", label: "🚂 Railways" }, { value: "teaching", label: "📚 Teaching" },
  { value: "it_tech", label: "💻 IT & Tech" }, { value: "healthcare", label: "🏥 Healthcare" },
  { value: "aviation", label: "✈️ Aviation" }, { value: "hospitality", label: "🏨 Hospitality" },
  { value: "legal", label: "⚖️ Law" }, { value: "finance_accounting", label: "📊 Finance/CA" },
  { value: "state_govt_rj", label: "🏰 Rajasthan Govt" }, { value: "police", label: "👮 Police" },
  { value: "psu", label: "🏭 PSU/Govt Enterprise" },
];
const CATEGORY_OPTIONS_EN = [
  { value: "", label: "Any Field" }, { value: "civil_services", label: "🏛️ Civil Services" },
  { value: "defense", label: "⚔️ Defense" }, { value: "banking", label: "🏦 Banking" },
  { value: "railways", label: "🚂 Railways" }, { value: "teaching", label: "📚 Teaching" },
  { value: "it_tech", label: "💻 IT & Technology" }, { value: "healthcare", label: "🏥 Healthcare" },
  { value: "aviation", label: "✈️ Aviation" }, { value: "hospitality", label: "🏨 Hospitality" },
  { value: "legal", label: "⚖️ Law" }, { value: "finance_accounting", label: "📊 Finance/CA" },
  { value: "state_govt_rj", label: "🏰 Rajasthan Govt" }, { value: "police", label: "👮 Police" },
  { value: "psu", label: "🏭 PSU/Govt Enterprise" },
];

export function OnboardingWizard({ onComplete, prefill }: OnboardingWizardProps) {
  const { language } = useProfileStore();
  const tr = useT(language);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", age: prefill?.age ?? "", gender: "", caste_category: "general",
    education: prefill?.education ?? "", experience_years: prefill?.experience_years ?? "0",
    experience_domain: prefill?.experience_domain ?? "",
    interests: prefill?.interests ?? [] as string[], location: "Rajasthan",
    category: prefill?.category ?? "",
  });

  const eduLabel = (opt: typeof EDUCATION_OPTIONS[0]) =>
    language === "hi" ? opt.label_hi : language === "hinglish" ? opt.label_hinglish : opt.label_en;

  const interestLabels = language === "hi" ? INTEREST_OPTIONS_HI : INTEREST_OPTIONS_HL;
  const categoryOptions = language === "hi" ? CATEGORY_OPTIONS_HI : language === "hinglish" ? CATEGORY_OPTIONS_HL : CATEGORY_OPTIONS_EN;

  const STEPS = [
    { id: "basic", icon: User, title: tr("ob_step_basic"), subtitle: tr("ob_step_basic_sub") },
    { id: "education", icon: GraduationCap, title: tr("ob_step_edu"), subtitle: tr("ob_step_edu_sub") },
    { id: "experience", icon: Briefcase, title: tr("ob_step_exp"), subtitle: tr("ob_step_exp_sub") },
    { id: "interests", icon: Heart, title: tr("ob_step_interests"), subtitle: tr("ob_step_interests_sub") },
    { id: "location", icon: MapPin, title: tr("ob_step_location"), subtitle: tr("ob_step_location_sub") },
  ];

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleInterest(value: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(value)
        ? f.interests.filter((i) => i !== value)
        : [...f.interests, value],
    }));
  }

  function canNext() {
    if (step === 0) return form.name && form.age;
    if (step === 1) return form.education;
    return true;
  }

  function handleComplete() {
    onComplete({
      name: form.name, age: Number(form.age),
      gender: form.gender as UserProfile["gender"],
      caste_category: form.caste_category as UserProfile["caste_category"],
      education: form.education, experience_years: Number(form.experience_years),
      experience_domain: form.experience_domain, interests: form.interests,
      location: form.location, category: form.category,
    });
  }

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  const selectedEduLabel = EDUCATION_OPTIONS.find(e => e.value === form.education);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language switcher at top */}
        <div className="flex justify-center mb-4">
          <LanguageSwitcher />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`flex flex-col items-center gap-1 ${i <= step ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-700 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{currentStep.title}</h2>
                <p className="text-sm text-slate-500">{currentStep.subtitle}</p>
              </div>
            </div>

            {/* Prefill banner */}
            {prefill && step === 0 && (
              <div className="mb-4 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700 flex items-center gap-2">
                <span>✨</span>
                <span>{language === "hi" ? "उदाहरण के अनुसार जानकारी भरी गई है — अपना नाम और उम्र डालें" : language === "hinglish" ? "Example se info pre-fill hai — apna naam aur age enter karein" : "Pre-filled from scenario — just enter your name and age"}</span>
              </div>
            )}

            {/* Step 0: Basic */}
            {step === 0 && (
              <div className="space-y-4">
                <Input label={tr("ob_name_label")} placeholder={tr("ob_name_ph")} value={form.name} onChange={(e) => update("name", e.target.value)} />
                <Input label={tr("ob_age_label")} type="number" placeholder={tr("ob_age_ph")} value={form.age} onChange={(e) => update("age", e.target.value)} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">{tr("ob_gender_label")}</label>
                  <div className="flex gap-2">
                    {[["male", tr("ob_gender_male")], ["female", tr("ob_gender_female")], ["other", tr("ob_gender_other")]].map(([val, label]) => (
                      <button key={val} onClick={() => update("gender", val)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                          form.gender === val ? "bg-blue-700 text-white border-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-700"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">{tr("ob_category_label")}</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                    value={form.caste_category} onChange={(e) => update("caste_category", e.target.value)}>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                    <option value="pwd">PwD</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 1: Education */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">{tr("ob_edu_prompt")}</p>
                <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                  {EDUCATION_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => update("education", opt.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        form.education === opt.value
                          ? "bg-blue-700 text-white border-blue-700"
                          : "border-slate-200 text-slate-700 hover:border-blue-700 hover:bg-blue-50"
                      }`}>
                      {eduLabel(opt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Experience */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">{tr("ob_exp_years_label")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {["0", "1", "2", "3", "4", "5", "6", "7", "8", "10+"].map((y) => (
                      <button key={y} onClick={() => update("experience_years", y)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          form.experience_years === y ? "bg-blue-700 text-white border-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-700"
                        }`}>
                        {y} {language === "hi" ? "वर्ष" : "yr"}
                      </button>
                    ))}
                  </div>
                </div>
                {Number(form.experience_years) > 0 && (
                  <Input
                    label={tr("ob_exp_domain_label")}
                    placeholder={tr("ob_exp_domain_ph")}
                    value={form.experience_domain}
                    onChange={(e) => update("experience_domain", e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">{tr("ob_interests_prompt")}</p>
                <div className="flex flex-wrap gap-2">
                  {interestLabels.map((label, idx) => {
                    const value = INTEREST_VALUES[idx];
                    return (
                      <button key={value} onClick={() => toggleInterest(value)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          form.interests.includes(value)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "border-slate-200 text-slate-600 hover:border-orange-400 hover:bg-orange-50"
                        }`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-sm font-medium text-slate-700">{tr("ob_preferred_cat")}</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                    value={form.category} onChange={(e) => update("category", e.target.value)}>
                    {categoryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Location */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">{tr("ob_location_label")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {["Rajasthan", "Delhi", "UP", "MP", "Gujarat", "Maharashtra", "Other"].map((loc) => (
                      <button key={loc} onClick={() => update("location", loc)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          form.location === loc ? "bg-blue-700 text-white border-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-700"
                        }`}>
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-700 text-sm mb-2">{tr("ob_summary_heading")}</h4>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>👤 <strong>{form.name}</strong>, {form.age} {language === "hi" ? "वर्ष" : "yrs"}</p>
                    <p>🎓 {selectedEduLabel ? eduLabel(selectedEduLabel) : "-"}</p>
                    <p>💼 {form.experience_years} {language === "hi" ? "वर्ष अनुभव" : "yrs exp"} {form.experience_domain ? `— ${form.experience_domain}` : ""}</p>
                    <p>❤️ {form.interests.join(", ") || (language === "hi" ? "निर्दिष्ट नहीं" : "Not specified")}</p>
                    <p>📍 {form.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button variant="outline" size="md" onClick={() => setStep(s => s - 1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> {tr("ob_btn_back")}
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button size="md" onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1 bg-blue-700 hover:bg-blue-800">
                  {tr("ob_btn_next")} <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="md" variant="saffron" onClick={handleComplete} className="flex-1">
                  <CheckCircle className="w-4 h-4" /> {tr("ob_btn_finish")}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
