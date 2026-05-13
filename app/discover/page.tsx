"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import PlayerCard from "@/components/PlayerCard";
import { X, Check, RefreshCw, Loader2, SlidersHorizontal } from "lucide-react";
import { BG_CITIES, SKILL_LEVELS } from "@/types";
import type { Profile } from "@/types";

const SWIPE_THRESHOLD = 80;

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const activeFilters = (filterCity ? 1 : 0) + (filterSkill ? 1 : 0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function init() {
      const { data: me } = await supabase
        .from("profiles").select("*").eq("id", user!.id).single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMyProfile((me as any) as Profile | null);
      await fetchProfiles("", "");
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function fetchProfiles(city: string, skill: string) {
    if (!user) return;
    setLoading(true);

    const { data: swipedRaw } = await supabase
      .from("matches").select("user2_id").eq("user1_id", user.id);
    const swipedIds = ((swipedRaw ?? []) as { user2_id: string }[]).map(s => s.user2_id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from("profiles").select("*")
      .neq("id", user.id)
      .order("rank_points", { ascending: false })
      .limit(20);

    if (swipedIds.length > 0) q = q.not("id", "in", `(${swipedIds.join(",")})`);
    if (city)  q = q.eq("city", city);
    if (skill) q = q.eq("skill_level", skill);

    const { data: list } = await q;
    const result = (list ?? []) as Profile[];
    setProfiles(result);
    setCurrentIndex(result.length - 1);
    setLoading(false);
  }

  function applyFilters() {
    setShowFilters(false);
    fetchProfiles(filterCity, filterSkill);
  }

  function resetFilters() {
    setFilterCity("");
    setFilterSkill("");
    setShowFilters(false);
    fetchProfiles("", "");
  }

  async function handleSwipe(direction: "left" | "right") {
    if (currentIndex < 0 || isAnimating || !myProfile) return;

    const profile = profiles[currentIndex];
    if (!profile) return;

    setIsAnimating(true);
    setExitDir(direction);
    await new Promise(r => setTimeout(r, 300));
    setCurrentIndex(prev => prev - 1);
    setExitDir(null);
    setIsAnimating(false);

    const action = direction === "right" ? "like" : "pass";
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc("handle_swipe", {
        p_user_id: myProfile.id,
        p_target_id: profile.id,
        p_action: action,
      });
      const result = data as { matched: boolean; match_id: string | null } | null;
      if (result?.matched && result.match_id) {
        router.push(`/chat/${result.match_id}`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
    }
  }

  const topCard = currentIndex >= 0 ? profiles[currentIndex] : null;
  const noMore = !loading && !authLoading && currentIndex < 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-3">
        <h1 className="text-2xl font-extrabold">
          Ping<span className="text-primary">Match</span>
        </h1>
        <div className="flex items-center gap-3">
          {currentIndex >= 0 && (
            <span className="text-muted text-sm">{currentIndex + 1} профила</span>
          )}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`relative p-2 rounded-xl border transition-colors ${
              showFilters || activeFilters > 0
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:text-white"
            }`}
          >
            <SlidersHorizontal size={18} />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-5"
          >
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Град</label>
                  <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
                    className="auth-input text-sm py-2">
                    <option value="" className="bg-card">Всички градове</option>
                    {BG_CITIES.map(c => (
                      <option key={c} value={c} className="bg-card">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Ниво</label>
                  <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)}
                    className="auth-input text-sm py-2">
                    <option value="" className="bg-card">Всички нива</option>
                    {SKILL_LEVELS.map(s => (
                      <option key={s} value={s} className="bg-card">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={applyFilters} className="btn-primary flex-1 text-sm py-2">Търси</button>
                {activeFilters > 0 && (
                  <button onClick={resetFilters} className="btn-secondary text-sm py-2 px-4">Нулирай</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      {activeFilters > 0 && !showFilters && (
        <div className="flex gap-2 px-5 pb-2 flex-wrap">
          {filterCity && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              📍 {filterCity}
              <button onClick={() => { setFilterCity(""); fetchProfiles("", filterSkill); }}>×</button>
            </span>
          )}
          {filterSkill && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              🏓 {filterSkill}
              <button onClick={() => { setFilterSkill(""); fetchProfiles(filterCity, ""); }}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Cards area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {noMore ? (
          <div className="text-center space-y-4">
            <span className="text-6xl">🏓</span>
            <h3 className="text-xl font-bold">
              {activeFilters > 0 ? "Няма профили с тези филтри" : "Няма повече профили"}
            </h3>
            <p className="text-muted text-sm">
              {activeFilters > 0 ? "Промени или нулирай филтрите" : "Провери отново по-късно"}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {activeFilters > 0 && (
                <button onClick={resetFilters} className="btn-secondary flex items-center gap-2">
                  Нулирай филтрите
                </button>
              )}
              <button onClick={() => fetchProfiles(filterCity, filterSkill)}
                className="btn-secondary flex items-center gap-2">
                <RefreshCw size={16} /> Опресни
              </button>
            </div>
          </div>
        ) : (
          <div className="relative" style={{ width: 340, height: 520 }}>
            {[currentIndex - 1, currentIndex - 2].map((idx, i) => {
              if (idx < 0 || !profiles[idx]) return null;
              return (
                <div key={profiles[idx].id}
                  className="absolute inset-0 rounded-3xl overflow-hidden bg-card border border-border"
                  style={{
                    transform: `scale(${0.95 - i * 0.03}) translateY(${(i + 1) * 8}px)`,
                    zIndex: 5 - i,
                  }}
                />
              );
            })}

            <AnimatePresence>
              {topCard && (
                <motion.div
                  key={topCard.id}
                  className="absolute inset-0"
                  style={{ zIndex: 10 }}
                  animate={
                    exitDir === "left"  ? { x: -600, rotate: -25, opacity: 0 }
                    : exitDir === "right" ? { x: 600,  rotate: 25,  opacity: 0 }
                    : { x: 0, rotate: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -SWIPE_THRESHOLD) handleSwipe("left");
                    else if (info.offset.x > SWIPE_THRESHOLD) handleSwipe("right");
                  }}
                >
                  <PlayerCard profile={topCard} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!noMore && topCard && (
        <div className="flex items-center justify-center gap-10 py-6 pb-24">
          <button
            onClick={() => handleSwipe("left")}
            disabled={isAnimating}
            className="w-16 h-16 rounded-full bg-surface border-2 border-danger/50 flex items-center justify-center hover:bg-danger/10 transition-colors active:scale-90 disabled:opacity-40"
          >
            <X size={30} className="text-danger" />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            disabled={isAnimating}
            className="w-16 h-16 rounded-full bg-surface border-2 border-primary/50 flex items-center justify-center hover:bg-primary/10 transition-colors active:scale-90 disabled:opacity-40"
          >
            <Check size={30} className="text-primary" />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
