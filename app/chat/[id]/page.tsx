import ChatRoom from "@/components/ChatRoom";

interface Props {
  params: { id: string };
}

export default function ChatPage({ params }: Props) {
  return <ChatRoom matchId={params.id} />;
}
