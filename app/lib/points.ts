export const WATCH_POINTS = 150;
export const MAX_LEVEL = 1_000_000;

export type LevelProgress = {
  level: number;
  pointsInLevel: number;
  pointsForNextLevel: bigint;
  totalPoints: number;
};

export const RANKS = [
  { id: "novice", name: "Novice", icon: "⚪", minLevel: 1, maxLevel: 1_000, badgeClass: "border-gray-400/35 bg-gray-400/10 text-gray-300" },
  { id: "bronze", name: "Bronze", icon: "🟤", minLevel: 1_001, maxLevel: 5_000, badgeClass: "border-amber-700/40 bg-amber-800/15 text-amber-500" },
  { id: "silver", name: "Silver", icon: "⚪", minLevel: 5_001, maxLevel: 15_000, badgeClass: "border-slate-200/40 bg-slate-200/10 text-slate-200" },
  { id: "gold", name: "Gold", icon: "🟡", minLevel: 15_001, maxLevel: 40_000, badgeClass: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300" },
  { id: "platinum", name: "Platinum", icon: "🔵", minLevel: 40_001, maxLevel: 90_000, badgeClass: "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" },
  { id: "diamond", name: "Diamond", icon: "🔷", minLevel: 90_001, maxLevel: 200_000, badgeClass: "border-blue-500/40 bg-blue-600/15 text-blue-300" },
  { id: "master", name: "Master", icon: "🔴", minLevel: 200_001, maxLevel: 400_000, badgeClass: "border-red-500/40 bg-red-500/10 text-red-400" },
  { id: "grandmaster", name: "Grandmaster", icon: "🟠", minLevel: 400_001, maxLevel: 700_000, badgeClass: "border-orange-400/40 bg-orange-400/10 text-orange-300" },
  { id: "legend", name: "Legend", icon: "💜", minLevel: 700_001, maxLevel: 950_000, badgeClass: "border-purple-400/40 bg-purple-500/10 text-purple-300" },
  { id: "mythic-divine", name: "Mythic Divine", icon: "🌈", minLevel: 950_001, maxLevel: MAX_LEVEL, badgeClass: "rank-badge-mythic border-fuchsia-300/50 text-white" },
] as const;

export type RankId = (typeof RANKS)[number]["id"];

export function getRankForLevel(level: number) {
  const safeLevel = Number.isSafeInteger(level) && level >= 1 ? Math.min(level, MAX_LEVEL) : 1;
  return RANKS.find((rank) => safeLevel <= rank.maxLevel) || RANKS[RANKS.length - 1];
}

const levelRequirements = new Map<number, bigint>();

export function getPointsForNextLevel(level: number): bigint {
  if (!Number.isSafeInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new RangeError(`Level harus berada di antara 1 dan ${MAX_LEVEL}.`);
  }

  const cachedRequirement = levelRequirements.get(level);
  if (cachedRequirement) return cachedRequirement;

  const requirement = BigInt(WATCH_POINTS) * BigInt(3) ** BigInt(level - 1);
  levelRequirements.set(level, requirement);
  return requirement;
}

export function getLevelProgress(totalPoints: number): LevelProgress {
  let remainingPoints = Number.isSafeInteger(totalPoints) && totalPoints > 0 ? totalPoints : 0;
  let level = 1;

  while (level < MAX_LEVEL && BigInt(remainingPoints) >= getPointsForNextLevel(level)) {
    remainingPoints -= Number(getPointsForNextLevel(level));
    level += 1;
  }

  return {
    level,
    pointsInLevel: remainingPoints,
    pointsForNextLevel: getPointsForNextLevel(level),
    totalPoints: Number.isSafeInteger(totalPoints) && totalPoints > 0 ? totalPoints : 0,
  };
}

export function getUserLevelProgress(level: number, pointsInLevel: number): LevelProgress {
  const safeLevel = Number.isSafeInteger(level) && level >= 1 ? Math.min(level, MAX_LEVEL) : 1;
  const safePoints = Number.isSafeInteger(pointsInLevel) && pointsInLevel > 0 ? pointsInLevel : 0;

  return {
    level: safeLevel,
    pointsInLevel: safePoints,
    pointsForNextLevel: getPointsForNextLevel(safeLevel),
    totalPoints: safePoints,
  };
}

export function formatPoints(points: bigint | number): string {
  const value = typeof points === "bigint" ? points : BigInt(points);
  if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value).toLocaleString("id-ID");
  }

  const digits = value.toString();
  return `${digits.slice(0, 3)}${digits.length > 3 ? `,${digits.slice(3, 4)}` : ""} × 10^${digits.length - 1}`;
}
