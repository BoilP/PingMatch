"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import RankBadge from "@/components/RankBadge";
import { Loader2, Trophy, ChevronDown } from "lucide-react";
import { BG_CITIES } from "@/types";
import type { Profile } from "@/types";

function avatar(profile: Profile) {
  return (
    profile.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/png?seed=${profile.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`
  );
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState<string>("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const myRank =
    user ? players.findIndex((p) => p.id === user.id) + 1 : 0;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    fetchPlayers("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCityPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchPlayers(city: string) {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from("profiles")
      .select("*")
      .order("rank_points", { ascending: false })
      .limit(100);

    if (city) q = q.eq("city", city);

    const { data } = await q;
    setPlayers((data ?? []) as Profile[]);
    setLoading(false);
  }

  function selectCity(city: string) {
    setFilterCity(city);
    setShowCityPicker(false);
    fetchPlayers(city);
  }

  function clearCity() {
    setFilterCity("");
    setShowCityPicker(false);
    fetchPlayers("");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative px-4 pt-12 pb-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            Класация
          </h1>

          {/* City filter */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowCityPicker((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                filterCity
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-surface border-border text-muted hover:text-white"
              }`}
            >
              {filterCity ? `📍 ${filterCity}` : "🌍 Всички"}
              <ChevronDown
                size={14}
                className={`transition-transform ${showCityPicker ? "rotate-180" : ""}`}
              />
            </button>

            {showCityPicker && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-card-lg z-50 overflow-hidden">
                <div className="max-h-72 overflow-y-auto overscroll-contain">
                  <button
                    onClick={clearCity}
                    className={`w-full text-left text-sm px-4 py-2.5 font-semibold transition-colors ${
                      !filterCity
                        ? "text-primary bg-primary/8"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    🌍 Всички градове
                  </button>
                  {BG_CITIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => selectCity(c)}
                      className={`w-full text-left text-sm px-4 py-2.5 transition-colors ${
                        filterCity === c
                          ? "text-primary bg-primary/8 font-semibold"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My rank summary */}
        {!loading && myRank > 0 && (
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted">Твоята позиция</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">
                {MEDAL[myRank] ?? `#${myRank}`}
              </span>
              {!MEDAL[myRank] && (
                <span className="text-sm text-muted font-medium">
                  от {players.length}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-28 space-y-2">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center pt-16 text-muted">
            Няма играчи{filterCity ? ` в ${filterCity}` : ""}
          </div>
        ) : (
          players.map((p, i) => {
            const pos = i + 1;
            const isMe = p.id === user?.id;
            const winRate =
              p.wins + p.losses > 0
                ? Math.round((p.wins / (p.wins + p.losses)) * 100)
                : 0;

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors ${
                  isMe
                    ? "bg-primary/8 border-primary/25"
                    : "bg-surface border-border"
                }`}
              >
                {/* Position */}
                <div className="w-8 text-center flex-shrink-0">
                  {MEDAL[pos] ? (
                    <span className="text-xl leading-none">{MEDAL[pos]}</span>
                  ) : (
                    <span
                      className={`text-sm font-black ${
                        isMe ? "text-primary" : "text-muted"
                      }`}
                    >
                      #{pos}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Image
                    src={avatar(p)}
                    alt={p.username}
                    width={44}
                    height={44}
                    className="rounded-xl object-cover"
                  />
                  {isMe && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-sm font-bold truncate ${
                        isMe ? "text-primary" : "text-white"
                      }`}
                    >
                      {p.username}
                    </span>
                    {isMe && (
                      <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                        ти
                      </span>
                    )}
                  </div>
                  <RankBadge points={p.rank_points} />
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-white">{p.rank_points}</p>
                  <p className="text-[11px] text-muted">
                    {p.wins}W · {p.losses}L · {winRate}%
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
