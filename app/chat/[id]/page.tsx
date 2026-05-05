import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";
import type { Match, Message, Profile } from "@/types";

interface Props {
  params: { id: string };
}

export default async function ChatPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: matchRaw } = await supabase
    .from("matches")
    .select("*")
    .eq("id", params.id)
    .single();

  const match = matchRaw as Match | null;

  if (!match || match.status !== "matched") redirect("/chat");
  if (match.user1_id !== user.id && match.user2_id !== user.id) redirect("/chat");

  const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;

  const [{ data: partnerRaw }, { data: messagesRaw }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", partnerId).single(),
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  const partner = partnerRaw as Profile | null;
  const messages = (messagesRaw ?? []) as Message[];

  if (!partner) redirect("/chat");

  return (
    <ChatRoom
      matchId={params.id}
      userId={user.id}
      partner={partner}
      initialMessages={messages}
    />
  );
}
