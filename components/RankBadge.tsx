"use client";

import { getRankTier } from "@/types";

interface RankBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  showPoints?: boolean;
}

export default function RankBadge({
  points,
  size = "md",
  showPoints = false,
}: RankBadgeProps) {
  const tier = getRankTier(points);

  const sizeMap = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeMap[size]}`}
      style={{
        background: `${tier.color}22`,
        border: `1px solid ${tier.color}55`,
        color: tier.color,
      }}
    >
      <span>{tier.emoji}</span>
      <span>{tier.name}</span>
      {showPoints && <span className="opacity-70">· {points}pts</span>}
    </span>
  );
}
