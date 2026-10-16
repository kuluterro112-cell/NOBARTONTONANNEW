export const WATCH_POINTS = 150;

export type LevelProgress = {
  level: number;
  pointsInLevel: number;
  pointsForNextLevel: number;
  totalPoints: number;
};

export function getLevelProgress(totalPoints: number): LevelProgress {
  let remainingPoints = Number.isSafeInteger(totalPoints) && totalPoints > 0 ? totalPoints : 0;
  let level = 1;
  let pointsForNextLevel = WATCH_POINTS;

  while (remainingPoints >= pointsForNextLevel) {
    remainingPoints -= pointsForNextLevel;
    level += 1;
    pointsForNextLevel *= 3;
    if (!Number.isSafeInteger(pointsForNextLevel)) break;
  }

  return {
    level,
    pointsInLevel: remainingPoints,
    pointsForNextLevel,
    totalPoints: Number.isSafeInteger(totalPoints) && totalPoints > 0 ? totalPoints : 0,
  };
}

export function getPointsAtLevelStart(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError("Level harus berupa bilangan bulat positif.");
  }

  let totalPoints = 0;
  let pointsForLevel = WATCH_POINTS;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    totalPoints += pointsForLevel;
    if (!Number.isSafeInteger(totalPoints)) {
      throw new RangeError("Level terlalu tinggi untuk disimpan sebagai poin.");
    }
    pointsForLevel *= 3;
    if (!Number.isSafeInteger(pointsForLevel) && currentLevel + 1 < level) {
      throw new RangeError("Level terlalu tinggi untuk disimpan sebagai poin.");
    }
  }

  return totalPoints;
}
