"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Trophy, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import GameResultModal from "@/components/GameResultModal";
import RankBadge from "./RankBadge";
import type { Message, Profile } from "@/types";

export default function ChatRoom({ matchId }: { matchId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultExists, setResultExists] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function load() {
      // Verify match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchRaw } = await (supabase as any)
        .from("matches").select("*").eq("id", matchId).single();
      const match = matchRaw as { id: string; user1_id: string; user2_id: string; status: string } | null;

      if (!match || match.status !== "matched" ||
          (match.user1_id !== user!.id && match.user2_id !== user!.id)) {
        router.push("/chat");
        return;
      }

      const partnerId = match.user1_id === user!.id ? match.user2_id : match.user1_id;

      // Load partner + my profile in parallel
      const [{ data: partnerData }, { data: meData }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", partnerId).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", user!.id).single(),
      ]);
      setPartner(partnerData as Profile);
      setMyProfile(meData as Profile);

      // Load messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: msgs } = await (supabase as any)
        .from("messages").select("*").eq("match_id", matchId)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as Message[]);

      // Check if game result already recorded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: resultData } = await (supabase as any)
        .from("game_results").select("id").eq("match_id", matchId).limit(1);
      const hasResult = ((resultData ?? []) as unknown[]).length > 0;
      if (!hasResult) {
        router.push(`/result/${matchId}`);
        return;
      }
      setResultExists(true);

      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, matchId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat:${matchId}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${matchId}`,
      }, (payload: { new: Message }) => {
        setMessages(prev =>
          prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending || !user) return;
    setSending(true);
    setText("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });
    setSending(false);
  }

  if (authLoading || loading || !partner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const avatarUrl = partner.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/png?seed=${partner.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border sticky top-0 bg-background z-10">
        <Link href="/chat" className="text-muted hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <Image src={avatarUrl} alt={partner.username} width={40} height={40}
          className="rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white leading-tight">{partner.username}</p>
          <RankBadge points={partner.rank_points} size="sm" showPoints />
        </div>
        {/* Result button in header */}
        {!resultExists ? (
          <button
            onClick={() => setShowResultModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors flex-shrink-0"
          >
            <Trophy size={13} />
            Резултат
          </button>
        ) : (
          <span className="text-xs text-primary/70 flex-shrink-0">✅ Записан</span>
        )}
      </header>

      {/* Result banner — shown when no result is entered */}
      {!resultExists && (
        <div className="mx-4 mt-3 mb-1 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Двубоят е приключил?</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Въведи резултата — той обновява ранкинга на двамата</p>
          </div>
          <button
            onClick={() => setShowResultModal(true)}
            className="text-xs font-bold text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-xl hover:bg-amber-400/10 transition-colors flex-shrink-0"
          >
            Въведи
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted py-10">
            <p>Кажи здравей на {partner.username}! 🏓</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? "bg-primary text-black rounded-br-md font-medium"
                  : "bg-surface border border-border text-white rounded-bl-md"
              }`}>
                {msg.content}
                <p className={`text-xs mt-1 ${isMe ? "text-black/50" : "text-muted"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("bg", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage}
        className="flex items-center gap-3 px-4 py-3 border-t border-border bg-surface">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Напиши съобщение..."
          className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95"
        >
          <Send size={16} className="text-black" />
        </button>
      </form>

      {/* Game result modal */}
      {myProfile && (
        <GameResultModal
          isOpen={showResultModal}
          matchId={matchId}
          myProfile={myProfile}
          partnerProfile={partner}
          onClose={() => setShowResultModal(false)}
          onSuccess={() => {
            setResultExists(true);
            setShowResultModal(false);
          }}
        />
      )}
    </div>
  );
}
