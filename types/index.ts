import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type TableLocation = Database["public"]["Tables"]["table_locations"]["Row"];
export type GameResult = Database["public"]["Tables"]["game_results"]["Row"];

export type SkillLevel =
  | "Начинаещ"
  | "Аматьор"
  | "Средно ниво"
  | "Напреднал"
  | "Професионалист";

export type RankTier = {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  emoji: string;
};

export const RANK_TIERS: RankTier[] = [
  { name: "Бронз", minPoints: 0, maxPoints: 200, color: "#cd7f32", emoji: "🥉" },
  { name: "Сребро", minPoints: 201, maxPoints: 500, color: "#9ca3af", emoji: "🥈" },
  { name: "Злато", minPoints: 501, maxPoints: 1000, color: "#f59e0b", emoji: "🥇" },
  { name: "Диамант", minPoints: 1001, maxPoints: 2000, color: "#60a5fa", emoji: "💎" },
  { name: "Легенда", minPoints: 2001, maxPoints: Infinity, color: "#22c55e", emoji: "👑" },
];

export function getRankTier(points: number): RankTier {
  return (
    RANK_TIERS.find((t) => points >= t.minPoints && points <= t.maxPoints) ??
    RANK_TIERS[0]
  );
}

export type MatchWithProfiles = Match & {
  profile: Profile;
  last_message?: string;
  unread_count?: number;
};
