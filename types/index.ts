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

export const SKILL_LEVELS: SkillLevel[] = [
  "Начинаещ",
  "Аматьор",
  "Средно ниво",
  "Напреднал",
  "Професионалист",
];

export const BG_CITIES = [
  "София", "Пловдив", "Варна", "Бургас", "Стара Загора", "Русе",
  "Плевен", "Велико Търново", "Видин", "Враца", "Благоевград", "Добрич",
  "Перник", "Хасково", "Шумен", "Пазарджик", "Ямбол", "Кюстендил",
  "Сливен", "Търговище", "Монтана", "Смолян", "Разград", "Силистра",
  "Ловеч", "Габрово", "Кърджали", "Виница",
];

export const CITY_COORDS: Record<string, [number, number]> = {
  "София":           [42.6977, 23.3219],
  "Пловдив":         [42.1354, 24.7453],
  "Варна":           [43.2141, 27.9147],
  "Бургас":          [42.5048, 27.4626],
  "Стара Загора":    [42.4258, 25.6345],
  "Русе":            [43.8356, 25.9657],
  "Плевен":          [43.4170, 24.6068],
  "Велико Търново":  [43.0757, 25.6172],
  "Видин":           [43.9931, 22.8742],
  "Враца":           [43.2043, 23.5528],
  "Благоевград":     [42.0139, 23.0996],
  "Добрич":          [43.5653, 27.8277],
  "Перник":          [42.6019, 23.0374],
  "Хасково":         [41.9344, 25.5558],
  "Шумен":           [43.2712, 26.9226],
  "Пазарджик":       [42.1920, 24.3336],
  "Ямбол":           [42.4838, 26.5022],
  "Кюстендил":       [42.2828, 22.6936],
  "Сливен":          [42.6858, 26.3290],
  "Търговище":       [43.2499, 26.5689],
  "Монтана":         [43.4083, 23.2251],
  "Смолян":          [41.5775, 24.7011],
  "Разград":         [43.5262, 26.5240],
  "Силистра":        [44.1162, 27.2617],
  "Ловеч":           [43.1328, 24.7147],
  "Габрово":         [42.8742, 25.3187],
  "Кърджали":        [41.6368, 25.3699],
  "Виница":          [43.4833, 27.7167],
};

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
