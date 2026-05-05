import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import RankBadge from "@/components/RankBadge";
import Image from "next/image";
import Link from "next/link";
import { Edit3, Trophy, Swords, TrendingUp, LogOut } from "lucide-react";
import { RANK_TIERS } from "@/types";
import type { Profile, GameResult } from "@/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as Profile | null;
  if (!profile) redirect("/auth/login");

  const winRate =
    profile.wins + profile.losses > 0
      ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
      : 0;

  const avatarUrl =
    profile.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.id}`;

  const currentTierIdx = RANK_TIERS.findIndex(
    (t) => profile.rank_points >= t.minPoints && profile.rank_points <= t.maxPoints
  );
  const currentTier = RANK_TIERS[currentTierIdx];
  const nextTier = RANK_TIERS[currentTierIdx + 1];
  const progressPct = nextTier
    ? Math.round(
        ((profile.rank_points - currentTier.minPoints) /
          (nextTier.minPoints - currentTier.minPoints)) *
          100
      )
    : 100;

  const { data: resultsRaw } = await supabase
    .from("game_results")
    .select("*")
    .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(5);

  const results = (resultsRaw ?? []) as GameResult[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          👤 <span className="text-primary">Профил</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/profile/edit" className="text-muted hover:text-white transition-colors">
            <Edit3 size={20} />
          </Link>
          <Link href="/auth/signout" className="text-muted hover:text-danger transition-colors">
            <LogOut size={20} />
          </Link>
        </div>
      </header>

      <div className="px-4 pb-28 space-y-4">
        {/* Profile card */}
        <div className="bg-surface border border-border rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <Image
              src={avatarUrl}
              alt={profile.username}
              width={72}
              height={72}
              className="rounded-full object-cover border-2 border-primary"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{profile.username}</h2>
              {profile.full_name && (
                <p className="text-muted text-sm">{profile.full_name}</p>
              )}
              <div className="mt-1.5">
                <RankBadge points={profile.rank_points} showPoints />
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-white/70 text-sm mt-4 leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {profile.city && (
              <span className="text-xs bg-card px-2.5 py-1 rounded-full text-muted">
                📍 {profile.city}
              </span>
            )}
            {profile.age && (
              <span className="text-xs bg-card px-2.5 py-1 rounded-full text-muted">
                🎂 {profile.age} г.
              </span>
            )}
            <span className="text-xs bg-card px-2.5 py-1 rounded-full text-muted">
              🏓 {profile.skill_level}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Trophy size={20} className="text-primary" />, value: profile.wins, label: "Победи" },
            { icon: <Swords size={20} className="text-danger" />, value: profile.losses, label: "Загуби" },
            { icon: <TrendingUp size={20} className="text-gold" />, value: `${winRate}%`, label: "Winrate" },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rank progress */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-white">Rank Progress</p>
            <span className="text-sm text-muted">{profile.rank_points} pts</span>
          </div>
          <div className="w-full bg-card rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted mt-1.5">
            <span style={{ color: currentTier?.color }}>
              {currentTier?.emoji} {currentTier?.name}
            </span>
            {nextTier && (
              <span style={{ color: nextTier.color }}>
                {nextTier.emoji} {nextTier.name}
              </span>
            )}
          </div>
        </div>

        {/* All ranks */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="font-semibold text-white mb-3">Ранг система</p>
          <div className="space-y-2">
            {RANK_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex items-center justify-between py-1.5 px-3 rounded-xl ${
                  currentTier?.name === tier.name ? "bg-card" : ""
                }`}
              >
                <span className="text-sm font-medium" style={{ color: tier.color }}>
                  {tier.emoji} {tier.name}
                </span>
                <span className="text-xs text-muted">
                  {tier.minPoints}
                  {tier.maxPoints === Infinity ? "+" : `–${tier.maxPoints}`} pts
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            🏆 Победа: +25 pts &nbsp;|&nbsp; 💔 Загуба: -15 pts
          </p>
        </div>

        {/* Recent results */}
        {results.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="font-semibold text-white mb-3">Последни резултати</p>
            <div className="space-y-2">
              {results.map((r) => {
                const won = r.winner_id === user.id;
                return (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <span className={`text-sm font-semibold ${won ? "text-primary" : "text-danger"}`}>
                      {won ? "✅ Победа" : "❌ Загуба"}
                    </span>
                    {r.winner_score != null && r.loser_score != null && (
                      <span className="text-sm text-muted">
                        {won
                          ? `${r.winner_score}:${r.loser_score}`
                          : `${r.loser_score}:${r.winner_score}`}
                      </span>
                    )}
                    <span className={`text-sm font-bold ${won ? "text-primary" : "text-danger"}`}>
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
