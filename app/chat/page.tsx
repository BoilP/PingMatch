"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/types";

interface MatchRow {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  updated_at: string;
}

interface ChatItem {
  match: MatchRow;
  partner: Profile;
  lastMsg: string | null;
}

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    async function load() {
      const { data: matchesRaw } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "matched")
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false });

      const matches = (matchesRaw ?? []) as MatchRow[];
      if (!matches.length) { setLoading(false); return; }

      const partnerIds = matches.map(m =>
        m.user1_id === user!.id ? m.user2_id : m.user1_id
      );

      const { data: profilesRaw } = await supabase
        .from("profiles").select("*").in("id", partnerIds);
      const profileMap = new Map(
        ((profilesRaw ?? []) as Profile[]).map(p => [p.id, p])
      );

      const { data: msgsRaw } = await supabase
        .from("messages")
        .select("match_id, content")
        .in("match_id", matches.map(m => m.id))
        .order("created_at", { ascending: false });

      const lastMsgMap = new Map<string, string>();
      (msgsRaw ?? []).forEach((m: { match_id: string; content: string }) => {
        if (!lastMsgMap.has(m.match_id)) lastMsgMap.set(m.match_id, m.content);
      });

      const result: ChatItem[] = matches
        .map(match => {
          const partnerId = match.user1_id === user!.id ? match.user2_id : match.user1_id;
          const partner = profileMap.get(partnerId);
          if (!partner) return null;
          return { match, partner, lastMsg: lastMsgMap.get(match.id) ?? null };
        })
        .filter(Boolean) as ChatItem[];

      setItems(result);
      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          💬 <span className="text-primary">Чатове</span>
        </h1>
        <p className="text-muted text-sm mt-1">{items.length} активни мача</p>
      </header>

      <div className="flex-1 px-4 pb-28 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <span className="text-5xl">🏓</span>
            <h3 className="text-lg font-bold">Все още нямаш мачове</h3>
            <p className="text-muted text-sm">Прелисти профили и намери противник</p>
            <Link href="/discover" className="btn-primary">Намери противник</Link>
          </div>
        ) : (
          items.map(({ match, partner, lastMsg }) => {
            const avatarUrl =
              partner.avatar_url ||
              `https://api.dicebear.com/8.x/avataaars/png?seed=${partner.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`;
            return (
              <Link
                key={match.id}
                href={`/chat/${match.id}`}
                className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors"
              >
                <Image src={avatarUrl} alt={partner.username} width={52} height={52}
                  className="rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{partner.username}</p>
                    <span className="text-xs text-muted">
                      {new Date(match.updated_at).toLocaleDateString("bg")}
                    </span>
                  </div>
                  <p className="text-sm text-muted truncate mt-0.5">
                    {lastMsg ?? "Изпрати първо съобщение..."}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
