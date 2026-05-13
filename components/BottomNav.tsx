"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Map, MessageCircle, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/discover", icon: Heart, label: "Discover" },
  { href: "/map",      icon: Map,           label: "Карта"   },
  { href: "/chat",     icon: MessageCircle, label: "Чат"     },
  { href: "/profile",  icon: User,          label: "Профил"  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 bg-surface/80 backdrop-blur-xl border border-white/8 rounded-2xl px-2 py-2 shadow-card-lg">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 ${
                active ? "text-primary" : "text-muted hover:text-white/70"
              }`}
            >
              {active && (
                <span className="absolute inset-0 rounded-xl bg-primary/10" />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className="relative"
              />
              <span className="relative text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
