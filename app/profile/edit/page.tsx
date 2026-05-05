"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import type { SkillLevel } from "@/types";

const SKILL_LEVELS: SkillLevel[] = [
  "Начинаещ",
  "Аматьор",
  "Средно ниво",
  "Напреднал",
  "Професионалист",
];

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    age: "",
    city: "",
    skill_level: "Начинаещ" as SkillLevel,
    bio: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: raw } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const data = raw as import("@/types").Profile | null;
      if (data) {
        setForm({
          username: data.username ?? "",
          full_name: data.full_name ?? "",
          age: data.age?.toString() ?? "",
          city: data.city ?? "",
          skill_level: data.skill_level as SkillLevel,
          bio: data.bio ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("profiles").update({
      username: form.username,
      full_name: form.full_name || null,
      age: form.age ? parseInt(form.age) : null,
      city: form.city,
      skill_level: form.skill_level as string,
      bio: form.bio || null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    setSaving(false);
    setSuccess(true);
    setTimeout(() => router.push("/profile"), 800);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 border-b border-border sticky top-0 bg-background z-10">
        <Link href="/profile" className="text-muted hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">Редактирай профил</h1>
      </header>

      <form onSubmit={handleSave} className="px-5 py-6 space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Потребителско име *
          </label>
          <input
            required
            type="text"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            className="auth-input"
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Пълно име
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            className="auth-input"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Възраст
            </label>
            <input
              type="number"
              min={10}
              max={100}
              value={form.age}
              onChange={(e) => update("age", e.target.value)}
              className="auth-input"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Град
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="auth-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Ниво на игра
          </label>
          <select
            value={form.skill_level}
            onChange={(e) => update("skill_level", e.target.value as SkillLevel)}
            className="auth-input"
          >
            {SKILL_LEVELS.map((s) => (
              <option key={s} value={s} className="bg-card">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Кратко представяне
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            maxLength={160}
            className="auth-input resize-none"
            placeholder="Кажи нещо за себе си..."
          />
          <p className="text-xs text-muted mt-1">{form.bio.length}/160</p>
        </div>

        <button
          type="submit"
          disabled={saving || success}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : success ? (
            "✅ Запазено!"
          ) : (
            <>
              <Save size={16} />
              Запази промените
            </>
          )}
        </button>
      </form>
    </div>
  );
}
