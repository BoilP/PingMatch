"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { SkillLevel } from "@/types";

const SKILL_LEVELS: SkillLevel[] = [
  "Начинаещ",
  "Аматьор",
  "Средно ниво",
  "Напреднал",
  "Професионалист",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    full_name: "",
    age: "",
    city: "София",
    skill_level: "Начинаещ" as SkillLevel,
    bio: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          full_name: form.full_name,
        },
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Грешка при регистрация.");
      setLoading(false);
      return;
    }

    // Update profile with extra fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        age: form.age ? parseInt(form.age) : null,
        city: form.city,
        skill_level: form.skill_level as string,
        bio: form.bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    router.push("/discover");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <span className="text-4xl">🏓</span>
            <span className="text-2xl font-extrabold">
              Ping<span className="text-primary">Match</span>
            </span>
          </Link>
          <p className="text-muted mt-2 text-sm">
            Стъпка {step} от 2 —{" "}
            {step === 1 ? "Акаунт" : "Твоят профил"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Имейл
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="email@example.com"
                  className="auth-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Потребителско име
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  placeholder="pingmaster99"
                  className="auth-input"
                />
                <p className="text-xs text-muted mt-1">
                  Само латиница, цифри и _
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Парола
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Мин. 6 символа"
                    className="auth-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Пълно име (по желание)
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  placeholder="Иван Иванов"
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
                    placeholder="25"
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
                    placeholder="София"
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
                  onChange={(e) =>
                    update("skill_level", e.target.value as SkillLevel)
                  }
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
                  Кратко представяне (по желание)
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Играя тенис на маса от 5 години..."
                  rows={3}
                  maxLength={160}
                  className="auth-input resize-none"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading
              ? "Регистрация..."
              : step === 1
              ? "Следващо →"
              : "Създай профил"}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary w-full"
            >
              ← Назад
            </button>
          )}
        </form>

        <p className="text-center text-muted mt-6 text-sm">
          Вече имаш акаунт?{" "}
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            Влез
          </Link>
        </p>
      </div>
    </main>
  );
}
