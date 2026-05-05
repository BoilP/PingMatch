"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Map, MessageCircle, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/discover", icon: Heart, label: "Discover" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/chat", icon: MessageCircle, label: "Чат" },
  { href: "/profile", icon: User, label: "Профил" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                active ? "text-primary" : "text-muted hover:text-white"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "text-primary" : ""}
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
