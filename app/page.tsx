import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/discover");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏓</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Ping<span className="text-primary">Match</span>
          </h1>
          <p className="text-muted text-lg md:text-xl mt-3 max-w-md mx-auto">
            Намери своя следващ противник за тенис на маса
          </p>
        </div>

        {/* CTA buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-6">
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
            Започни безплатно
          </Link>
          <Link href="/auth/login" className="btn-secondary text-lg px-8 py-4">
            Вход
          </Link>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl w-full">
          {[
            {
              emoji: "🃏",
              title: "Swipe & Match",
              desc: "Прелиствай профили и намирай противници на твоето ниво",
            },
            {
              emoji: "🗺️",
              title: "Карта с маси",
              desc: "Виж свободните маси из града в реално време",
            },
            {
              emoji: "💬",
              title: "Чат & Уговорка",
              desc: "Договори се директно след успешен мач",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-2xl p-6 text-left hover:border-primary/30 transition-colors"
            >
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="font-bold text-white mt-3 mb-1">{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted text-sm py-6 border-t border-border">
        © 2025 PingMatch. Всички права запазени.
      </footer>
    </main>
  );
}
