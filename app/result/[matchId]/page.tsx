"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Trophy, Zap } from "lucide-react";
import type { Profile } from "@/types";

interface Props {
  params: { matchId: string };
}

export default function ResultPage({ params }: Props) {
  const { matchId } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [partner, setPartner] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState<"me" | "partner" | null>(null);
  const [myScore, setMyScore] = useState("");
  const [partnerScore, setPartnerScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchRaw } = await (supabase as any)
        .from("matches").select("*").eq("id", matchId).single();
      const match = matchRaw as { id: string; user1_id: string; user2_id: string; status: string } | null;

      if (!match || match.status !== "matched") { router.push("/discover"); return; }

      // Check if result already recorded → skip to chat
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("game_results").select("id").eq("match_id", matchId).limit(1);
      if (((existing ?? []) as unknown[]).length > 0) {
        router.push(`/chat/${matchId}`);
        return;
      }

      const partnerId = match.user1_id === user!.id ? match.user2_id : match.user1_id;
      const [{ data: p }, { data: me }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", partnerId).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", user!.id).single(),
      ]);
      setPartner(p as Profile);
      setMyProfile(me as Profile);
      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, matchId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winner || !myProfile || !partner) { setError("Избери кой е спечелил."); return; }

    setSaving(true);
    setError(null);

    const winnerId = winner === "me" ? myProfile.id : partner.id;
    const loserId  = winner === "me" ? partner.id : myProfile.id;
    const wScore = winner === "me" ? (parseInt(myScore) || null) : (parseInt(partnerScore) || null);
    const lScore = winner === "me" ? (parseInt(partnerScore) || null) : (parseInt(myScore) || null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc("record_game_result", {
        p_match_id: matchId,
        p_winner_id: winnerId,
        p_loser_id: loserId,
        p_winner_score: wScore,
        p_loser_score: lScore,
      });
      router.push(`/chat/${matchId}`);
    } catch {
      setError("Грешка при записване. Опитай пак.");
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!myProfile || !partner) return null;

  const myAvatar = myProfile.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${myProfile.id}`;
  const partnerAvatar = partner.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${partner.id}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-danger/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            <Zap size={11} fill="currentColor" />
            Двубоят завърши
          </div>
          <h1 className="text-3xl font-extrabold text-white">Кой спечели?</h1>
          <p className="text-muted text-sm mt-1">Задължително поле — без него не можете да продължите</p>
        </div>

        {/* VS matchup */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="text-center flex-1">
            <div className={`relative mx-auto w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
              winner === "me" ? "border-primary shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "border-border"
            }`}>
              <Image src={myAvatar} alt={myProfile.username} fill className="object-cover" />
            </div>
            <p className="text-sm font-semibold text-white mt-2 truncate">{myProfile.username}</p>
            <p className="text-xs text-muted">Ти</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
              <span className="text-base font-black text-muted">VS</span>
            </div>
          </div>

          <div className="text-center flex-1">
            <div className={`relative mx-auto w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
              winner === "partner" ? "border-danger shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "border-border"
            }`}>
              <Image src={partnerAvatar} alt={partner.username} fill className="object-cover" />
            </div>
            <p className="text-sm font-semibold text-white mt-2 truncate">{partner.username}</p>
            <p className="text-xs text-muted">Противник</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Winner buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWinner("me")}
              className={`group relative overflow-hidden p-5 rounded-2xl border-2 text-center transition-all duration-200 ${
                winner === "me"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface hover:border-primary/40"
              }`}
            >
              {winner === "me" && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              )}
              <div className="relative">
                <div className="text-3xl mb-2">🏆</div>
                <p className={`font-bold text-sm ${winner === "me" ? "text-primary" : "text-white"}`}>
                  Аз спечелих
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setWinner("partner")}
              className={`group relative overflow-hidden p-5 rounded-2xl border-2 text-center transition-all duration-200 ${
                winner === "partner"
                  ? "border-danger bg-danger/10"
                  : "border-border bg-surface hover:border-danger/40"
              }`}
            >
              {winner === "partner" && (
                <div className="absolute inset-0 bg-gradient-to-br from-danger/10 to-transparent" />
              )}
              <div className="relative">
                <div className="text-3xl mb-2">💪</div>
                <p className={`font-bold text-sm truncate ${winner === "partner" ? "text-danger" : "text-white"}`}>
                  {partner.username}
                </p>
                <p className={`text-xs ${winner === "partner" ? "text-danger/70" : "text-muted"}`}>спечели</p>
              </div>
            </button>
          </div>

          {/* Score */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs text-muted text-center mb-3 uppercase tracking-wider font-semibold">
              Резултат <span className="normal-case font-normal">(по желание)</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted mb-1.5 truncate">{myProfile.username}</p>
                <input
                  type="number" min={0} max={99} value={myScore}
                  onChange={e => setMyScore(e.target.value)}
                  placeholder="0"
                  className="auth-input text-center text-2xl font-black py-3 tracking-tight"
                />
              </div>
              <span className="text-muted font-black text-xl mt-5">:</span>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted mb-1.5 truncate">{partner.username}</p>
                <input
                  type="number" min={0} max={99} value={partnerScore}
                  onChange={e => setPartnerScore(e.target.value)}
                  placeholder="0"
                  className="auth-input text-center text-2xl font-black py-3 tracking-tight"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !winner}
            className="relative w-full overflow-hidden group"
          >
            <div className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
              winner ? "opacity-100" : "opacity-0"
            } bg-gradient-to-r from-primary to-primary-light`} />
            <div className={`absolute inset-0 rounded-xl bg-primary transition-opacity duration-200 ${
              winner ? "opacity-0" : "opacity-100"
            }`} />
            <span className="relative flex items-center justify-center gap-2 text-black font-bold py-4 px-6 rounded-xl disabled:opacity-40 transition-all">
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? "Записване..." : (
                <>
                  <Trophy size={16} />
                  Запиши и продължи към чата
                </>
              )}
            </span>
          </button>

          <p className="text-center text-muted text-xs">
            Резултатът обновява ранкинга на двамата играчи
          </p>
        </form>
      </div>
    </div>
  );
}
