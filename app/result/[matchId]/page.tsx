"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import RankBadge from "@/components/RankBadge";
import {
  MessageCircle, Map, Trophy, Send, Loader2, Zap,
} from "lucide-react";
import type { Message, Profile, TableLocation } from "@/types";
import { CITY_COORDS } from "@/types";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-surface rounded-2xl" style={{ height: 260 }}>
      <Loader2 size={22} className="animate-spin text-primary" />
    </div>
  ),
});

type Tab = "chat" | "map" | "result";

interface Props { params: { matchId: string } }

function avatar(profile: Profile) {
  return profile.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/png?seed=${profile.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`;
}

export default function DuelRoom({ params }: Props) {
  const { matchId } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [locations, setLocations] = useState<TableLocation[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  // Result form
  const [winner, setWinner] = useState<"me" | "partner" | null>(null);
  const [myScore, setMyScore] = useState("");
  const [partnerScore, setPartnerScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchRaw } = await (supabase as any)
        .from("matches").select("*").eq("id", matchId).single();
      const match = matchRaw as { id: string; user1_id: string; user2_id: string; status: string } | null;

      if (!match || match.status !== "matched") { router.push("/discover"); return; }

      // If result already recorded → go to regular chat
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("game_results").select("id").eq("match_id", matchId).limit(1);
      if (((existing ?? []) as unknown[]).length > 0) {
        router.push(`/chat/${matchId}`); return;
      }

      const partnerId = match.user1_id === user!.id ? match.user2_id : match.user1_id;

      const [{ data: p }, { data: me }, { data: msgs }, { data: locs }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", partnerId).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", user!.id).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("messages").select("*").eq("match_id", matchId)
          .order("created_at", { ascending: true }),
        supabase.from("table_locations").select("*").order("name"),
      ]);

      setPartner(p as Profile);
      setMyProfile(me as Profile);
      setMessages((msgs ?? []) as Message[]);
      setLocations((locs ?? []) as TableLocation[]);
      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, matchId]);

  // Realtime chat
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`duel:${matchId}`)
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
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending || !user) return;
    setSending(true);
    setText("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("messages").insert({
      match_id: matchId, sender_id: user.id, content,
    });
    setSending(false);
  }

  async function handleResult(e: React.FormEvent) {
    e.preventDefault();
    if (!winner || !myProfile || !partner) { setResultError("Избери кой е спечелил."); return; }
    setSaving(true);
    setResultError(null);

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
      setResultError("Грешка при записване. Опитай пак.");
      setSaving(false);
    }
  }

  const mapCenter: [number, number] =
    (myProfile?.city && CITY_COORDS[myProfile.city]) ||
    [42.6977, 23.3219];

  if (authLoading || loading || !partner || !myProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "chat",   icon: MessageCircle, label: "Чат"      },
    { id: "map",    icon: Map,           label: "Маси"     },
    { id: "result", icon: Trophy,        label: "Резултат" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Match header ── */}
      <div className="relative px-4 pt-10 pb-5 border-b border-border overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/6 to-transparent pointer-events-none" />

        {/* Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
            <Zap size={10} fill="currentColor" /> Двубой намерен
          </span>
        </div>

        {/* VS strip */}
        <div className="relative flex items-center justify-center gap-5">
          {/* Me */}
          <div className="text-center w-24">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/40 mx-auto shadow-glow-sm">
              <Image src={avatar(myProfile)} alt={myProfile.username} fill className="object-cover" />
            </div>
            <p className="text-xs font-bold text-white mt-1.5 truncate">{myProfile.username}</p>
            <RankBadge points={myProfile.rank_points} size="sm" />
          </div>

          {/* VS */}
          <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-black text-muted">VS</span>
          </div>

          {/* Partner */}
          <div className="text-center w-24">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-border mx-auto">
              <Image src={avatar(partner)} alt={partner.username} fill className="object-cover" />
            </div>
            <p className="text-xs font-bold text-white mt-1.5 truncate">{partner.username}</p>
            <RankBadge points={partner.rank_points} size="sm" />
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-border bg-surface/60 flex-shrink-0">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors ${
              tab === id ? "text-primary" : "text-muted hover:text-white/60"
            }`}
          >
            {tab === id && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full" />
            )}
            <Icon size={15} />
            {label}
            {id === "result" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* CHAT */}
      {tab === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <p className="text-4xl">💬</p>
                <p className="text-white font-semibold text-sm">Уговорете се кога и къде!</p>
                <p className="text-muted text-xs">Провери таба „Маси" за налични локации</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-black rounded-br-md font-semibold"
                      : "bg-surface border border-border text-white rounded-bl-md"
                  }`}>
                    {msg.content}
                    <p className={`text-[10px] mt-1 ${isMe ? "text-black/50" : "text-muted"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("bg", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage}
            className="flex items-center gap-3 px-4 py-3 border-t border-border bg-surface/80 backdrop-blur-sm flex-shrink-0">
            <input
              type="text" value={text} onChange={e => setText(e.target.value)}
              placeholder="Напиши съобщение..."
              className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-white placeholder-muted/60 focus:outline-none focus:border-primary/60 text-sm transition-colors"
              maxLength={1000}
            />
            <button type="submit" disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all">
              <Send size={15} className="text-black" />
            </button>
          </form>
        </div>
      )}

      {/* MAP */}
      {tab === "map" && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs text-muted">
              {locations.filter(l => l.is_available).length} свободни ·{" "}
              {locations.filter(l => !l.is_available).length} заети маси
            </p>
          </div>

          <div className="mx-4 rounded-2xl overflow-hidden border border-border">
            <MapClient locations={locations} center={mapCenter} zoom={13} />
          </div>

          <div className="px-4 pt-3 pb-6 space-y-2">
            {locations.map(loc => (
              <div key={loc.id}
                className="glass rounded-2xl p-3.5 flex items-center justify-between">
                <div className="min-w-0 mr-3">
                  <p className="font-semibold text-white text-sm truncate">{loc.name}</p>
                  {loc.address && <p className="text-xs text-muted mt-0.5 truncate">{loc.address}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    {loc.opening_hours && <span>🕐 {loc.opening_hours}</span>}
                    <span>🏓 {loc.tables_count}</span>
                    {loc.price_per_hour && <span>💰 {loc.price_per_hour} лв/ч</span>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  loc.is_available ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"
                }`}>
                  {loc.is_available ? "Свободно" : "Заето"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULT */}
      {tab === "result" && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="text-center mb-6">
            <p className="text-white font-black text-xl">Кой спечели?</p>
            <p className="text-muted text-sm mt-1">
              Задължително — без него не можете да продължите
            </p>
          </div>

          <form onSubmit={handleResult} className="space-y-4 max-w-sm mx-auto pb-6">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setWinner("me")}
                className={`relative overflow-hidden p-5 rounded-2xl border-2 text-center transition-all duration-200 ${
                  winner === "me"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:border-primary/40"
                }`}>
                {winner === "me" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
                )}
                <div className="relative">
                  <div className="text-3xl mb-2">🏆</div>
                  <p className={`font-bold text-sm ${winner === "me" ? "text-primary" : "text-white"}`}>
                    Аз спечелих
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">{myProfile.username}</p>
                </div>
              </button>

              <button type="button" onClick={() => setWinner("partner")}
                className={`relative overflow-hidden p-5 rounded-2xl border-2 text-center transition-all duration-200 ${
                  winner === "partner"
                    ? "border-danger bg-danger/10"
                    : "border-border bg-surface hover:border-danger/40"
                }`}>
                {winner === "partner" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-danger/15 to-transparent" />
                )}
                <div className="relative">
                  <div className="text-3xl mb-2">💪</div>
                  <p className={`font-bold text-sm truncate ${winner === "partner" ? "text-danger" : "text-white"}`}>
                    {partner.username}
                  </p>
                  <p className={`text-xs mt-0.5 ${winner === "partner" ? "text-danger/70" : "text-muted"}`}>
                    спечели
                  </p>
                </div>
              </button>
            </div>

            {/* Score */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-muted text-center mb-3 font-semibold uppercase tracking-wider">
                Резултат <span className="normal-case font-normal">(по желание)</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted mb-1.5 truncate">{myProfile.username}</p>
                  <input type="number" min={0} max={99} value={myScore}
                    onChange={e => setMyScore(e.target.value)} placeholder="0"
                    className="auth-input text-center text-2xl font-black py-3" />
                </div>
                <span className="text-muted font-black text-xl mt-5">:</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted mb-1.5 truncate">{partner.username}</p>
                  <input type="number" min={0} max={99} value={partnerScore}
                    onChange={e => setPartnerScore(e.target.value)} placeholder="0"
                    className="auth-input text-center text-2xl font-black py-3" />
                </div>
              </div>
            </div>

            {resultError && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 text-center">
                {resultError}
              </p>
            )}

            <button type="submit" disabled={saving || !winner}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? "Записване..." : <><Trophy size={16} /> Запиши и продължи</>}
            </button>

            <p className="text-center text-muted/60 text-xs">
              Резултатът обновява ранкинга и на двамата играчи
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
