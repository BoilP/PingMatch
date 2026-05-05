"use client";

import Image from "next/image";
import RankBadge from "./RankBadge";
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

  const avatarUrl =
    profile.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.id}&backgroundColor=1a1a1a`;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden select-none bg-card border border-border shadow-2xl">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={avatarUrl}
          alt={profile.username}
          fill
          className="object-cover"
          draggable={false}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        {/* Name + age */}
        <div className="flex items-end gap-2">
          <h2 className="text-2xl font-bold text-white leading-none">
            {profile.username}
          </h2>
          {profile.age && (
            <span className="text-xl text-white/80">{profile.age}</span>
          )}
        </div>

        {/* Rank */}
        <div>
          <RankBadge points={profile.rank_points} showPoints />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-primary font-medium">
            <Trophy size={14} />
            {profile.wins}W
          </span>
          <span className="flex items-center gap-1 text-danger font-medium">
            <Swords size={14} />
            {profile.losses}L
          </span>
          <span className="text-white/60">{winRate}% winrate</span>
        </div>

        {/* Location + skill */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-white/60 text-sm">
            <MapPin size={13} />
            {profile.city}
          </span>
          <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">
            {profile.skill_level}
          </span>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-white/70 line-clamp-2">{profile.bio}</p>
        )}
      </div>
    </div>
  );
}
