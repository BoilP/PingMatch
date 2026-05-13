"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Trophy, X, Loader2 } from "lucide-react";
import type { Profile } from "@/types";

interface GameResultModalProps {
  isOpen: boolean;
  matchId: string;
  myProfile: Profile;
  partnerProfile: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GameResultModal({
  isOpen,
  matchId,
  myProfile,
  partnerProfile,
  onClose,
  onSuccess,
}: GameResultModalProps) {
  const supabase = createClient();
  const [winner, setWinner] = useState<"me" | "partner" | null>(null);
  const [myScore, setMyScore] = useState("");
  const [partnerScore, setPartnerScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winner) { setError("Избери кой е спечелил двубоя."); return; }

    setSaving(true);
    setError(null);

    const winnerId = winner === "me" ? myProfile.id : partnerProfile.id;
    const loserId  = winner === "me" ? partnerProfile.id : myProfile.id;
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
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Грешка при записване. Опитай пак.");
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-primary" />
                <h3 className="text-lg font-bold">Въведи резултат</h3>
              </div>
              <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Winner selection */}
              <div>
                <p className="text-sm text-muted mb-3">Кой спечели двубоя?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWinner("me")}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      winner === "me"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <div className="text-2xl mb-1">🏆</div>
                    <p className={`font-semibold text-sm ${winner === "me" ? "text-primary" : "text-white"}`}>
                      Аз спечелих
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">{myProfile.username}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWinner("partner")}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      winner === "partner"
                        ? "border-danger bg-danger/10"
                        : "border-border bg-surface hover:border-danger/40"
                    }`}
                  >
                    <div className="text-2xl mb-1">💪</div>
                    <p className={`font-semibold text-sm truncate ${winner === "partner" ? "text-danger" : "text-white"}`}>
                      {partnerProfile.username}
                    </p>
                    <p className="text-xs text-muted mt-0.5">спечели</p>
                  </button>
                </div>
              </div>

              {/* Score */}
              <div>
                <p className="text-sm text-muted mb-2">Резултат <span className="text-xs">(по желание)</span></p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted mb-1 truncate">{myProfile.username}</p>
                    <input
                      type="number" min={0} max={99} value={myScore}
                      onChange={e => setMyScore(e.target.value)}
                      placeholder="0"
                      className="auth-input text-center text-xl font-bold py-2"
                    />
                  </div>
                  <span className="text-muted font-bold text-lg mt-4">:</span>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted mb-1 truncate">{partnerProfile.username}</p>
                    <input
                      type="number" min={0} max={99} value={partnerScore}
                      onChange={e => setPartnerScore(e.target.value)}
                      placeholder="0"
                      className="auth-input text-center text-xl font-bold py-2"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving || !winner}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Записване..." : "Запиши резултата"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
