"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Bot, Zap, Shield, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useProfileStore } from "@/store/profile";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { language } = useProfileStore();
  const tr = useT(language);

  const SCENARIOS = [
    { emoji: "🎓", title: tr("scenario_1_title"), desc: tr("scenario_1_desc"), gradient: "from-purple-600 to-blue-600" },
    { emoji: "✈️", title: tr("scenario_2_title"), desc: tr("scenario_2_desc"), gradient: "from-blue-500 to-cyan-600" },
    { emoji: "🏛️", title: tr("scenario_3_title"), desc: tr("scenario_3_desc"), gradient: "from-orange-500 to-red-500" },
    { emoji: "🏨", title: tr("scenario_4_title"), desc: tr("scenario_4_desc"), gradient: "from-green-500 to-teal-600" },
  ];

  const FEATURES = [
    { icon: MapPin, title: tr("feat_1_title"), desc: tr("feat_1_desc") },
    { icon: Bot, title: tr("feat_2_title"), desc: tr("feat_2_desc") },
    { icon: Zap, title: tr("feat_3_title"), desc: tr("feat_3_desc") },
    { icon: Shield, title: tr("feat_4_title"), desc: tr("feat_4_desc") },
    { icon: TrendingUp, title: tr("feat_5_title"), desc: tr("feat_5_desc") },
    { icon: Users, title: tr("feat_6_title"), desc: tr("feat_6_desc") },
  ];

  const STATS = [
    { value: "80+", label: tr("stat_careers") },
    { value: "50+", label: tr("stat_exams") },
    { value: "100%", label: tr("stat_free") },
    { value: "24/7", label: tr("stat_support") },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">{tr("nav_brand")}</span>
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">{tr("nav_region")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">{tr("nav_dashboard")}</Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="saffron">{tr("nav_start")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
              {tr("hero_badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight"
          >
            {tr("hero_heading_1")}{" "}
            <span className="bg-gradient-to-r from-blue-700 to-orange-500 bg-clip-text text-transparent">
              {tr("hero_heading_2")}
            </span>
            {tr("hero_heading_3") ? ` ${tr("hero_heading_3")}` : ""}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto"
          >
            {tr("hero_sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/onboarding">
              <Button size="xl" variant="saffron" className="w-full sm:w-auto">
                {tr("hero_cta_map")} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                <Bot className="w-5 h-5" /> {tr("hero_cta_chat")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-blue-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center text-white">
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-blue-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{tr("scenarios_heading")}</h2>
            <p className="text-slate-500">{tr("scenarios_sub")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {SCENARIOS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-5 text-white bg-gradient-to-br ${s.gradient}`}
              >
                <div className="text-4xl mb-3">{s.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/80 text-sm mb-4">{s.desc}</p>
                <Link href={`/onboarding?scenario=${i}`}>
                  <button className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors">
                    {tr("scenario_try")}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{tr("features_heading")}</h2>
            <p className="text-slate-500">{tr("features_sub")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-700 to-blue-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold mb-3">{tr("cta_heading")}</h2>
          <p className="text-blue-200 mb-8">{tr("cta_sub")}</p>
          <Link href="/onboarding">
            <Button size="xl" variant="saffron">
              {tr("cta_btn")} <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-slate-100 text-center text-sm text-slate-400">
        <p>{tr("footer_text")}</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/admin" className="hover:text-blue-600">{tr("footer_admin")}</Link>
          <Link href="/dashboard" className="hover:text-blue-600">{tr("footer_dashboard")}</Link>
          <Link href="/map" className="hover:text-blue-600">{tr("footer_map")}</Link>
        </div>
      </footer>
    </main>
  );
}
