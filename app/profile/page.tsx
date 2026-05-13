"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import RankBadge from "@/components/RankBadge";
import { Edit3, Trophy, Swords, TrendingUp, LogOut, Loader2 } from "lucide-react";
import { RANK_TIERS } from "@/types";
import type { Profile, GameResult } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function load() {
      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user!.id).single();
      setProfile(p as Profile | null);

      const { data: r } = await supabase
        .from("game_results").select("*")
        .or(`winner_id.eq.${user!.id},loser_id.eq.${user!.id}`)
        .order("created_at", { ascending: false }).limit(5);
      setResults((r ?? []) as GameResult[]);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (authLoading || loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const winRate = profile.wins + profile.losses > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) : 0;

  const avatarUrl = profile.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.id}`;

  const currentTierIdx = RANK_TIERS.findIndex(
    t => profile.rank_points >= t.minPoints && profile.rank_points <= t.maxPoints
  );
  const currentTier = RANK_TIERS[currentTierIdx];
  const nextTier = RANK_TIERS[currentTierIdx + 1];
  const progressPct = nextTier
    ? Math.round(((profile.rank_points - currentTier.minPoints) /
        (nextTier.minPoints - currentTier.minPoints)) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero header card */}
      <div className="relative px-4 pt-12 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-5">
          <h1 className="text-xl font-black text-white tracking-tight">Профил</h1>
          <div className="flex items-center gap-2">
            <Link href="/profile/edit"
              className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-white hover:border-white/20 transition-all">
              <Edit3 size={16} />
            </Link>
            <button onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-danger hover:border-danger/30 transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Image src={avatarUrl} alt={profile.username} width={76} height={76}
                className="rounded-2xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white leading-tight truncate">{profile.username}</h2>
              {profile.full_name && <p className="text-muted text-sm truncate">{profile.full_name}</p>}
              <div className="mt-1.5">
                <RankBadge points={profile.rank_points} showPoints />
              </div>
            </div>
          </div>
          {profile.bio && (
            <p className="text-white/60 text-sm mt-4 leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex gap-2 mt-4 flex-wrap">
            {profile.city && (
              <span className="text-xs bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-white/50">
                📍 {profile.city}
              </span>
            )}
            {profile.age && (
              <span className="text-xs bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-white/50">
                🎂 {profile.age} г.
              </span>
            )}
            <span className="text-xs bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-white/50">
              🏓 {profile.skill_level}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Trophy size={18} className="text-primary" />, value: profile.wins,   label: "Победи",  bg: "bg-primary/8"  },
            { icon: <Swords size={18} className="text-danger"  />, value: profile.losses, label: "Загуби",  bg: "bg-danger/8"   },
            { icon: <TrendingUp size={18} className="text-gold"/>, value: `${winRate}%`,   label: "Winrate", bg: "bg-gold/8"     },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-white/6 rounded-2xl p-4 text-center`}>
              <div className="flex justify-center mb-1.5">{s.icon}</div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[11px] text-muted font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rank progress */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-white text-sm">Rank Progress</p>
            <span className="text-xs text-primary font-semibold">{profile.rank_points} pts</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${currentTier?.color}99, ${currentTier?.color})`,
              }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="font-semibold" style={{ color: currentTier?.color }}>
              {currentTier?.emoji} {currentTier?.name}
            </span>
            {nextTier && (
              <span className="font-semibold" style={{ color: nextTier.color }}>
                {nextTier.emoji} {nextTier.name} →
              </span>
            )}
          </div>
        </div>

        {/* Rank tiers */}
        <div className="glass rounded-2xl p-4">
          <p className="font-bold text-white text-sm mb-3">Ранг система</p>
          <div className="space-y-1.5">
            {RANK_TIERS.map(tier => (
              <div key={tier.name}
                className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
                  currentTier?.name === tier.name ? "bg-white/6" : ""
                }`}>
                <span className="text-sm font-semibold" style={{ color: tier.color }}>
                  {tier.emoji} {tier.name}
                  {currentTier?.name === tier.name && (
                    <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/50 font-normal">ти</span>
                  )}
                </span>
                <span className="text-xs text-muted">
                  {tier.minPoints}{tier.maxPoints === Infinity ? "+" : `–${tier.maxPoints}`} pts
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted/60 mt-3 text-center">
            🏆 +25 pts победа &nbsp;·&nbsp; 💔 -15 pts загуба
          </p>
        </div>

        {results.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="font-bold text-white text-sm mb-3">Последни резултати</p>
            <div className="space-y-2">
              {results.map(r => {
                const won = r.winner_id === user?.id;
                return (
                  <div key={r.id}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                      won ? "bg-primary/8" : "bg-danger/8"
                    }`}>
                    <span className={`text-sm font-bold ${won ? "text-primary" : "text-danger"}`}>
                      {won ? "🏆 Победа" : "💔 Загуба"}
                    </span>
                    {r.winner_score != null && r.loser_score != null && (
                      <span className="text-sm text-muted font-mono">
                        {won ? `${r.winner_score}:${r.loser_score}` : `${r.loser_score}:${r.winner_score}`}
                      </span>
                    )}
                    <span className={`text-sm font-black ${won ? "text-primary" : "text-danger"}`}>
                      {won ? "+25" : "-15"} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
