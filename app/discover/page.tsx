"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import PlayerCard from "@/components/PlayerCard";
import { X, Check, RefreshCw, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function load() {
      // Зареди собствения профил
      const { data: me } = await supabase
        .from("profiles").select("*").eq("id", user!.id).single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMyProfile((me as any) as Profile | null);

      // Вземи вече swipe-нати профили
      const { data: swipedRaw } = await supabase
        .from("matches").select("user2_id").eq("user1_id", user!.id);
      const swipedIds = ((swipedRaw ?? []) as { user2_id: string }[]).map(s => s.user2_id);

      // Вземи кандидати
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from("profiles").select("*")
        .neq("id", user!.id)
        .order("rank_points", { ascending: false })
        .limit(20);

      if (swipedIds.length > 0) {
        q = q.not("id", "in", `(${swipedIds.join(",")})`);
      }

      const { data: list } = await q;
      const result = (list ?? []) as Profile[];
      setProfiles(result);
      setCurrentIndex(result.length - 1);
      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function handleSwipe(direction: "left" | "right") {
    if (currentIndex < 0 || isAnimating || !myProfile) return;

    const profile = profiles[currentIndex];
    if (!profile) return;

    // Анимирай картата
    setIsAnimating(true);
    setExitDir(direction);
    await new Promise(r => setTimeout(r, 300));
    setCurrentIndex(prev => prev - 1);
    setExitDir(null);
    setIsAnimating(false);

    // Запиши в базата
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

  async function reload() {
    if (!user) return;
    setLoading(true);
    const { data: list } = await supabase
      .from("profiles").select("*")
      .neq("id", user.id)
      .order("rank_points", { ascending: false })
      .limit(20);
    const result = (list ?? []) as Profile[];
    setProfiles(result);
    setCurrentIndex(result.length - 1);
    setLoading(false);
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
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          Ping<span className="text-primary">Match</span>
        </h1>
        {currentIndex >= 0 && (
          <span className="text-muted text-sm">{currentIndex + 1} профила</span>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {noMore ? (
          <div className="text-center space-y-4">
            <span className="text-6xl">🏓</span>
            <h3 className="text-xl font-bold">Няма повече профили</h3>
            <p className="text-muted text-sm">Провери отново по-късно</p>
            <button onClick={reload} className="btn-secondary flex items-center gap-2 mx-auto">
              <RefreshCw size={16} /> Опресни
            </button>
          </div>
        ) : (
          <div className="relative" style={{ width: 340, height: 520 }}>
            {/* Фонови карти (stack ефект) */}
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

            {/* Горна карта */}
            <AnimatePresence>
              {topCard && (
                <motion.div
                  key={topCard.id}
                  className="absolute inset-0"
                  style={{ zIndex: 10 }}
                  animate={
                    exitDir === "left" ? { x: -600, rotate: -25, opacity: 0 }
                    : exitDir === "right" ? { x: 600, rotate: 25, opacity: 0 }
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

      {/* Бутони */}
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
