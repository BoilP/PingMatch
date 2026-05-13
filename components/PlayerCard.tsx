"use client";

import { useState } from "react";
import Image from "next/image";
import RankBadge from "./RankBadge";
import { isVideo } from "./MediaUpload";
import type { Profile } from "@/types";
import { MapPin, Trophy, Swords, ChevronLeft, ChevronRight } from "lucide-react";

interface PlayerCardProps {
  profile: Profile;
}

export default function PlayerCard({ profile }: PlayerCardProps) {
  const winRate =
    profile.wins + profile.losses > 0
      ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
      : 0;

  const defaultAvatar = `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.id}&backgroundColor=1a1a1a`;
  const mediaItems: string[] = [
    ...(profile.avatar_url ? [profile.avatar_url] : [defaultAvatar]),
    ...(profile.media_urls ?? []),
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);
  const current = mediaItems[idx] ?? mediaItems[0];

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setIdx(i => (i - 1 + mediaItems.length) % mediaItems.length);
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setIdx(i => (i + 1) % mediaItems.length);
  }

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden select-none bg-card border border-border shadow-2xl">
      {/* Media background */}
      <div className="absolute inset-0">
        {isVideo(current) ? (
          <video
            key={current}
            src={current}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay muted playsInline loop
          />
        ) : (
          <Image
            key={current}
            src={current}
            alt={profile.username}
            fill
            className="object-cover"
            draggable={false}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Dots indicator */}
      {mediaItems.length > 1 && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-20 pointer-events-none">
          {mediaItems.map((_, i) => (
            <div key={i}
              className={`h-1 rounded-full transition-all duration-200 ${
                i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation tap zones */}
      {mediaItems.length > 1 && (
        <>
          <button
            onPointerDown={prev}
            className="absolute left-0 inset-y-0 w-1/3 z-20 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Предишна"
          >
            <div className="bg-black/40 rounded-full p-1">
              <ChevronLeft size={18} className="text-white" />
            </div>
          </button>
          <button
            onPointerDown={next}
            className="absolute right-0 inset-y-0 w-1/3 z-20 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Следваща"
          >
            <div className="bg-black/40 rounded-full p-1">
              <ChevronRight size={18} className="text-white" />
            </div>
          </button>
        </>
      )}

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3 z-10">
        {/* Name + age */}
        <div className="flex items-end gap-2">
          <h2 className="text-2xl font-bold text-white leading-none">{profile.username}</h2>
          {profile.age && <span className="text-xl text-white/80">{profile.age}</span>}
        </div>

        {/* Rank */}
        <div>
          <RankBadge points={profile.rank_points} showPoints />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-primary font-medium">
            <Trophy size={14} />{profile.wins}W
          </span>
          <span className="flex items-center gap-1 text-danger font-medium">
            <Swords size={14} />{profile.losses}L
          </span>
          <span className="text-white/60">{winRate}% winrate</span>
        </div>

        {/* Location + skill */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-white/60 text-sm">
            <MapPin size={13} />{profile.city}
          </span>
          <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">
            {profile.skill_level}
          </span>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-white/70 line-clamp-2">{profile.bio}</p>
        )}

        {/* Media count badge */}
        {mediaItems.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/50">
              {idx + 1}/{mediaItems.length} {isVideo(current) ? "🎥" : "📷"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
