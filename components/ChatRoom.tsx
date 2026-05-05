"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RankBadge from "./RankBadge";
import type { Message, Profile } from "@/types";

interface ChatRoomProps {
  matchId: string;
  userId: string;
  partner: Profile;
  initialMessages: Message[];
}

export default function ChatRoom({
  matchId,
  userId,
  partner,
  initialMessages,
}: ChatRoomProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload: { new: Message }) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).removeChannel(channel);
    };
  }, [matchId, supabase]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      content,
    });

    setSending(false);
  }

  const avatarUrl =
    partner.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${partner.id}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-safe-top pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
        <Link href="/chat" className="text-muted hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <Image
          src={avatarUrl}
          alt={partner.username}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-white leading-tight">
            {partner.username}
          </p>
          <RankBadge points={partner.rank_points} size="sm" showPoints />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted py-10">
            <p>Кажи здравей на {partner.username}! 🏓</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-primary text-black rounded-br-md font-medium"
                    : "bg-surface border border-border text-white rounded-bl-md"
                }`}
              >
                {msg.content}
                <p
                  className={`text-xs mt-1 ${
                    isMe ? "text-black/50" : "text-muted"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString("bg", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 px-4 py-3 border-t border-border bg-surface"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
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
    </div>
  );
}
