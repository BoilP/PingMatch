import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/discover");

  return (
    <main className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center relative z-10">

        {/* Floating logo */}
        <div className="animate-float mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto shadow-glow">
            <span className="text-5xl select-none">🏓</span>
          </div>
        </div>

        {/* Wordmark */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-3">
          Ping<span className="text-primary">Match</span>
        </h1>
        <p className="text-muted text-base sm:text-lg max-w-xs mx-auto leading-relaxed">
          Намери своя следващ противник за тенис на маса — swipe, match и играй.
        </p>

        {/* Stats strip */}
        <div className="flex items-center gap-6 mt-8 mb-10">
          {[
            { value: "100+", label: "Играчи" },
            { value: "5",    label: "Нива"   },
            { value: "24/7", label: "Достъп" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-xs text-muted font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
          <Link href="/auth/register"
            className="btn-primary flex-1 text-base py-4 text-center">
            Започни безплатно
          </Link>
          <Link href="/auth/login"
            className="btn-secondary flex-1 text-base py-4 text-center">
            Влез
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-14 w-full max-w-2xl">
          {[
            {
              emoji: "🃏",
              title: "Swipe & Match",
              desc: "Прелиствай профили и намирай противници на твоето ниво",
            },
            {
              emoji: "🗺️",
              title: "Карта с маси",
              desc: "Виж свободните маси в реално време",
            },
            {
              emoji: "🏆",
              title: "Ранг система",
              desc: "Качвай ранг с всяка победа — от Бронз до Легенда",
            },
          ].map(f => (
            <div key={f.title}
              className="glass rounded-2xl p-5 text-left hover:border-primary/20 transition-colors">
              <span className="text-2xl">{f.emoji}</span>
              <h3 className="font-bold text-white text-sm mt-2 mb-1">{f.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-muted/50 text-xs py-5">
        © 2025 PingMatch
      </footer>
    </main>
  );
}
