"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, MapPin, Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import matrixData from "@/data/career-matrix.json";

interface Career {
  id: string;
  title: string;
  category: string;
  description?: string;
  min_education?: string[];
  age_criteria?: { min: number; max: number };
  salary_range?: { entry: string };
  [key: string]: unknown;
}

export default function AdminPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "", title: "", title_hi: "", category: "state_govt_rj",
    description: "", min_education: "graduation_any",
    age_min: "18", age_max: "40", salary_entry: "", timeline: "",
    selection_process: "", growth_path: "", skills_required: "",
    job_locations: "Rajasthan", tags: "",
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/matrix").then((r) => r.json()).then((d) => setCareers(d.careers ?? []));
  }, []);

  const categories = matrixData.categories as Record<string, { label: string; icon: string }>;

  function resetForm() {
    setForm({ id: "", title: "", title_hi: "", category: "state_govt_rj", description: "", min_education: "graduation_any", age_min: "18", age_max: "40", salary_entry: "", timeline: "", selection_process: "", growth_path: "", skills_required: "", job_locations: "Rajasthan", tags: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(career: Career) {
    setForm({
      id: career.id,
      title: career.title,
      title_hi: (career.title_hi as string) ?? "",
      category: career.category,
      description: (career.description as string) ?? "",
      min_education: Array.isArray(career.min_education) ? career.min_education[0] : "graduation_any",
      age_min: String(career.age_criteria?.min ?? 18),
      age_max: String(career.age_criteria?.max ?? 40),
      salary_entry: (career.salary_range as { entry: string })?.entry ?? "",
      timeline: (career.timeline_to_enter as string) ?? "",
      selection_process: Array.isArray(career.selection_process) ? (career.selection_process as string[]).join("\n") : "",
      growth_path: Array.isArray(career.growth_path) ? (career.growth_path as string[]).join("\n") : "",
      skills_required: Array.isArray(career.skills_required) ? (career.skills_required as string[]).join(", ") : "",
      job_locations: Array.isArray(career.job_locations) ? (career.job_locations as string[]).join(", ") : String(career.job_locations ?? ""),
      tags: Array.isArray(career.tags) ? (career.tags as string[]).join(", ") : "",
    });
    setEditingId(career.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.id || !form.title || !form.category) {
      setStatus({ type: "error", msg: "ID, Title aur Category required hain" });
      return;
    }
    setLoading(true);
    setStatus(null);

    const payload = {
      id: form.id.toLowerCase().replace(/\s+/g, "_"),
      title: form.title,
      title_hi: form.title_hi,
      category: form.category,
      description: form.description,
      min_education: [form.min_education],
      eligible_streams: ["any"],
      age_criteria: { min: Number(form.age_min), max: Number(form.age_max) },
      salary_range: { entry: form.salary_entry },
      timeline_to_enter: form.timeline,
      selection_process: form.selection_process.split("\n").filter(Boolean),
      growth_path: form.growth_path.split("\n").filter(Boolean),
      skills_required: form.skills_required.split(",").map((s) => s.trim()).filter(Boolean),
      job_locations: form.job_locations.split(",").map((s) => s.trim()),
      demand_level: "medium",
      competitive_level: "medium",
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      exams: [],
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/matrix", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", msg: `Career "${form.title}" ${editingId ? "updated" : "added"} successfully!` });
        const refreshed = await fetch("/api/matrix").then((r) => r.json());
        setCareers(refreshed.careers ?? []);
        resetForm();
      } else {
        setStatus({ type: "error", msg: data.error ?? "Error saving" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Career "${id}" delete karna chahte ho?`)) return;
    const res = await fetch("/api/matrix", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (data.success) {
      setCareers((c) => c.filter((career) => career.id !== id));
      setStatus({ type: "success", msg: "Career deleted." });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Admin Panel</span>
            </Link>
            <Badge variant="category">{careers.length} careers</Badge>
          </div>
          <Button size="sm" variant="saffron" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Career
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {status && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-lg border flex items-center gap-2 text-sm ${
              status.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
            }`}>
            <AlertCircle className="w-4 h-4 shrink-0" /> {status.msg}
          </motion.div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">{editingId ? "Career Edit Karo" : "Naya Career Add Karo"}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Career ID *" placeholder="e.g. rseb_helper" value={form.id} onChange={(e) => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editingId} />
              <Input label="Title (English) *" placeholder="Career ka naam" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              <Input label="Title (Hindi)" placeholder="हिंदी नाम" value={form.title_hi} onChange={(e) => setForm(f => ({ ...f, title_hi: e.target.value }))} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Category *</label>
                <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(categories).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <textarea rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Min Education</label>
                <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  value={form.min_education} onChange={(e) => setForm(f => ({ ...f, min_education: e.target.value }))}>
                  {Object.entries(matrixData.education_levels).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <Input label="Salary (Entry)" placeholder="e.g. ₹25,000–35,000/month" value={form.salary_entry} onChange={(e) => setForm(f => ({ ...f, salary_entry: e.target.value }))} />
              <Input label="Age Min" type="number" value={form.age_min} onChange={(e) => setForm(f => ({ ...f, age_min: e.target.value }))} />
              <Input label="Age Max" type="number" value={form.age_max} onChange={(e) => setForm(f => ({ ...f, age_max: e.target.value }))} />
              <Input label="Timeline" placeholder="e.g. 6–12 months preparation" value={form.timeline} onChange={(e) => setForm(f => ({ ...f, timeline: e.target.value }))} />
              <Input label="Job Locations" placeholder="Rajasthan, Pan India" value={form.job_locations} onChange={(e) => setForm(f => ({ ...f, job_locations: e.target.value }))} />
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Selection Process (ek line = ek step)</label>
                <textarea rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Written Exam&#10;Physical Test&#10;Document Verification"
                  value={form.selection_process} onChange={(e) => setForm(f => ({ ...f, selection_process: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Growth Path (ek line = ek level)</label>
                <textarea rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Junior Officer&#10;Senior Officer&#10;Director"
                  value={form.growth_path} onChange={(e) => setForm(f => ({ ...f, growth_path: e.target.value }))} />
              </div>
              <Input label="Skills Required (comma separated)" placeholder="Hindi, GK, Math" value={form.skills_required} onChange={(e) => setForm(f => ({ ...f, skills_required: e.target.value }))} />
              <Input label="Tags (comma separated)" placeholder="rajasthan, state_govt, popular" value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="flex gap-3 mt-5">
              <Button size="md" onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4" /> {loading ? "Saving..." : editingId ? "Update Career" : "Add Career"}
              </Button>
              <Button size="md" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Careers Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Career</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Age</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Education</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {careers.map((career) => {
                    const cat = categories[career.category];
                    return (
                      <tr key={career.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{career.title}</div>
                          <div className="text-xs text-slate-400">{career.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-600">{cat?.icon} {cat?.label}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {career.age_criteria?.min}–{career.age_criteria?.max}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {Array.isArray(career.min_education) ? career.min_education[0] : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(career)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(career.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
