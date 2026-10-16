export const WATCH_POINTS = 150;
export const MAX_LEVEL = 100_000;

export type LevelProgress = {
  level: number;
  pointsInLevel: number;
  pointsForNextLevel: bigint;
  totalPoints: number;
};

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
