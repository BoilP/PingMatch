"use client";

import { useState } from "react";
import Image from "next/image";
import RankBadge from "./RankBadge";
import { isVideo } from "./MediaUpload";
import type { Profile } from "@/types";
import { MapPin, Trophy, Swords } from "lucide-react";

interface PlayerCardProps {
  profile: Profile;
}

export default function PlayerCard({ profile }: PlayerCardProps) {
  const winRate =
    profile.wins + profile.losses > 0
      ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
      : 0;

  const defaultAvatar = `https://api.dicebear.com/8.x/avataaars/png?seed=${profile.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`;
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
    <div className="relative w-full h-full rounded-3xl overflow-hidden select-none bg-card shadow-card-lg">
      {/* Media */}
      <div className="absolute inset-0">
        {isVideo(current) ? (
          <video key={current} src={current}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay muted playsInline loop />
        ) : (
          <Image key={current} src={current} alt={profile.username}
            fill className="object-cover" draggable={false} priority />
        )}
        {/* Gradient — stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />
      </div>

      {/* Dots */}
      {mediaItems.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {mediaItems.map((_, i) => (
            <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${
              i === idx ? "w-6 bg-white" : "w-2 bg-white/35"
            }`} />
          ))}
        </div>
      )}

      {/* Tap zones */}
      {mediaItems.length > 1 && (
        <>
          <button onPointerDown={prev}
            className="absolute left-0 inset-y-0 w-1/3 z-20" aria-label="Предишна" />
          <button onPointerDown={next}
            className="absolute right-0 inset-y-0 w-1/3 z-20" aria-label="Следваща" />
        </>
      )}

      {/* Skill badge top-right */}
      <div className="absolute top-4 right-4 z-10">
        <span className="text-xs font-semibold bg-black/50 backdrop-blur-sm text-white/90 px-2.5 py-1 rounded-full border border-white/10">
          {profile.skill_level}
        </span>
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2.5 z-10">
        {/* Name + age */}
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-black text-white leading-none tracking-tight">
            {profile.username}
          </h2>
          {profile.age && (
            <span className="text-lg text-white/60 font-semibold">{profile.age}</span>
          )}
        </div>

        {/* Rank */}
        <RankBadge points={profile.rank_points} showPoints />

        {/* Stats row */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/8 rounded-xl px-3 py-1.5">
            <Trophy size={12} className="text-primary" />
            <span className="text-xs font-bold text-white">{profile.wins}W</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/8 rounded-xl px-3 py-1.5">
            <Swords size={12} className="text-danger" />
            <span className="text-xs font-bold text-white">{profile.losses}L</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/8 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-white">{winRate}%</span>
          </div>
          {profile.city && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm border border-white/8 rounded-xl px-3 py-1.5 ml-auto">
              <MapPin size={10} className="text-white/50" />
              <span className="text-xs text-white/70 font-medium">{profile.city}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs text-white/60 leading-relaxed line-clamp-2 font-medium">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
