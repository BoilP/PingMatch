import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Match, Message, Profile } from "@/types";

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: matchesRaw } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "matched")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const matches = (matchesRaw ?? []) as Match[];

  const partnerIds = matches.map((m) =>
    m.user1_id === user.id ? m.user2_id : m.user1_id
  );

  const { data: partnerProfilesRaw } = partnerIds.length
    ? await supabase.from("profiles").select("*").in("id", partnerIds)
    : { data: [] };

  const partnerProfiles = (partnerProfilesRaw ?? []) as Profile[];
  const profileMap = new Map(partnerProfiles.map((p) => [p.id, p]));

  const matchIds = matches.map((m) => m.id);
  const { data: lastMessagesRaw } = matchIds.length
    ? await supabase
        .from("messages")
        .select("*")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lastMessages = (lastMessagesRaw ?? []) as Message[];
  const lastMsgMap = new Map<string, string>();
  lastMessages.forEach((msg) => {
    if (!lastMsgMap.has(msg.match_id)) {
      lastMsgMap.set(msg.match_id, msg.content);
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          💬 <span className="text-primary">Чатове</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          {matches.length} активни мача
        </p>
      </header>

      <div className="flex-1 px-4 pb-28 space-y-2">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <span className="text-5xl">🏓</span>
            <h3 className="text-lg font-bold">Все още нямаш мачове</h3>
            <p className="text-muted text-sm">
              Прелисти профили в Discover и намери противник
            </p>
            <Link href="/discover" className="btn-primary">
              Намери противник
            </Link>
          </div>
        ) : (
          matches.map((match) => {
            const partnerId =
              match.user1_id === user.id ? match.user2_id : match.user1_id;
            const partner = profileMap.get(partnerId);
            const lastMsg = lastMsgMap.get(match.id);

            if (!partner) return null;

            const avatarUrl =
              partner.avatar_url ||
              `https://api.dicebear.com/8.x/avataaars/svg?seed=${partner.id}`;

            return (
              <Link
                key={match.id}
                href={`/chat/${match.id}`}
                className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors"
              >
                <Image
                  src={avatarUrl}
                  alt={partner.username}
                  width={52}
                  height={52}
                  className="rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">
                      {partner.username}
                    </p>
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
