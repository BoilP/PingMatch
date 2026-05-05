"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";
import MatchModal from "@/components/MatchModal";
import PlayerCard from "@/components/PlayerCard";
import { X, Check, RefreshCw, Loader2 } from "lucide-react";
import type { Profile } from "@/types";

// SSR=false because react-tinder-card uses DOM APIs
const TinderCard = dynamic(() => import("react-tinder-card"), { ssr: false });

export default function DiscoverPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [matchModal, setMatchModal] = useState<{
    open: boolean;
    matchId: string | null;
    profile: Profile | null;
  }>({ open: false, matchId: null, profile: null });

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRefs = useRef<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: meRaw } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setMyProfile(meRaw as Profile | null);

      const { data: swipedRaw } = await supabase
        .from("matches")
        .select("user2_id")
        .eq("user1_id", user.id);

      const swipedIds = ((swipedRaw ?? []) as { user2_id: string }[]).map(
        (s) => s.user2_id
      );

      let candidatesQuery = supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("rank_points", { ascending: false })
        .limit(20);

      if (swipedIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        candidatesQuery = (candidatesQuery as any).not(
          "id",
          "in",
          `(${swipedIds.join(",")})`
        );
      }

      const { data: candidatesRaw } = await candidatesQuery;
      const list = (candidatesRaw ?? []) as Profile[];
      setProfiles(list);
      setCurrentIndex(list.length - 1);
      cardRefs.current = list.map(() => null);
      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swipe = useCallback(
    async (direction: "left" | "right", index: number) => {
      const profile = profiles[index];
      if (!profile || !myProfile) return;

      const action = direction === "right" ? "like" : "pass";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc("handle_swipe", {
        p_user_id: myProfile.id,
        p_target_id: profile.id,
        p_action: action,
      });

      const result = data as { matched: boolean; match_id: string | null } | null;

      if (result?.matched) {
        setMatchModal({ open: true, matchId: result.match_id, profile });
      }

      setCurrentIndex((prev) => prev - 1);
    },
    [profiles, myProfile, supabase]
  );

  async function triggerSwipe(dir: "left" | "right") {
    const idx = currentIndexRef.current;
    if (idx < 0 || !cardRefs.current[idx]) return;
    await cardRefs.current[idx].swipe(dir);
  }

  async function reload() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: candidatesRaw } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .order("rank_points", { ascending: false })
      .limit(20);

    const list = (candidatesRaw ?? []) as Profile[];
    setProfiles(list);
    setCurrentIndex(list.length - 1);
    cardRefs.current = list.map(() => null);
    setLoading(false);
  }

  const remaining = currentIndex + 1;
  const noMore = !loading && remaining === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          Ping<span className="text-primary">Match</span>
        </h1>
        {remaining > 0 && (
          <span className="text-muted text-sm">{remaining} профила</span>
        )}
      </header>

      {/* Card stack */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-muted">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p>Зареждане на профили...</p>
          </div>
        ) : noMore ? (
          <div className="text-center space-y-4">
            <span className="text-6xl">🏓</span>
            <h3 className="text-xl font-bold">Няма повече профили</h3>
            <p className="text-muted text-sm">
              Провери отново по-късно за нови играчи
            </p>
            <button
              onClick={reload}
              className="btn-secondary flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Опресни
            </button>
          </div>
        ) : (
          <div className="card-container relative">
            {profiles.map((profile, index) => (
              <TinderCard
                key={profile.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ref={(el: any) => {
                  cardRefs.current[index] = el;
                }}
                onSwipe={(dir: string) => {
                  if (dir === "right" || dir === "left") swipe(dir, index);
                }}
                preventSwipe={["up", "down"]}
                className="swipe absolute inset-0"
              >
                <div className="w-full h-full" style={{ userSelect: "none" }}>
                  <PlayerCard profile={profile} />
                </div>
              </TinderCard>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!loading && !noMore && (
        <div className="flex items-center justify-center gap-8 py-6 pb-24">
          <button
            onClick={() => triggerSwipe("left")}
            className="w-16 h-16 rounded-full bg-surface border border-danger/40 flex items-center justify-center hover:bg-danger/10 transition-colors active:scale-95"
            aria-label="Откажи"
          >
            <X size={28} className="text-danger" />
          </button>

          <button
            onClick={() => triggerSwipe("right")}
            className="w-16 h-16 rounded-full bg-surface border border-primary/40 flex items-center justify-center hover:bg-primary/10 transition-colors active:scale-95"
            aria-label="Прими"
          >
            <Check size={28} className="text-primary" />
          </button>
        </div>
      )}

      <BottomNav />

      <MatchModal
        isOpen={matchModal.open}
        matchId={matchModal.matchId}
        matchedProfile={matchModal.profile}
        currentProfile={myProfile}
        onClose={() =>
          setMatchModal({ open: false, matchId: null, profile: null })
        }
      />
    </div>
  );
}
