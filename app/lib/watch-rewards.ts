import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth } from "./firebase-client";
import { db } from "./firebase-profile";
import { getLevelProgress, getPointsForNextLevel, MAX_LEVEL, WATCH_POINTS } from "./points";

function rewardDocumentId(contentKey: string) {
  let hash = BigInt("14695981039346656037");
  for (let index = 0; index < contentKey.length; index += 1) {
    hash ^= BigInt(contentKey.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * BigInt("1099511628211"));
  }
  return hash.toString(16).padStart(16, "0");
}

export async function rewardWatchedContent(
  contentKey: string,
): Promise<"earned" | "already-earned" | "max-level" | "unauthenticated"> {
  const user = auth.currentUser;
  if (!user) return "unauthenticated";

  const userRef = doc(db, "users", user.uid);
  const rewardId = rewardDocumentId(contentKey);
  const rewardRef = doc(db, "users", user.uid, "watchRewards", rewardId);

  const result = await runTransaction(db, async (transaction) => {
    const [userSnapshot, rewardSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(rewardRef),
    ]);

    if (rewardSnapshot.exists()) return "already-earned" as const;
    if (!userSnapshot.exists()) {
      throw new Error("Profil pengguna tidak ditemukan; poin tontonan tidak dapat disimpan.");
    }

    const userData = userSnapshot.data();
    const hasStoredLevel = Number.isSafeInteger(userData.level) && userData.level >= 1;
    const progress = hasStoredLevel
      ? {
          level: Math.min(userData.level as number, MAX_LEVEL),
          pointsInLevel: Number.isSafeInteger(userData.xpPoints) && userData.xpPoints > 0
            ? userData.xpPoints as number
            : 0,
        }
      : getLevelProgress(typeof userData.xpPoints === "number" ? userData.xpPoints : 0);
    let level = progress.level;
    if (level >= MAX_LEVEL) return "max-level" as const;
    let pointsInLevel = progress.pointsInLevel + WATCH_POINTS;
    if (BigInt(pointsInLevel) >= getPointsForNextLevel(level)) {
      level += 1;
      pointsInLevel = 0;
    }
    if (!Number.isSafeInteger(pointsInLevel)) {
      throw new Error("Data poin pengguna tidak valid; poin tontonan tidak dapat disimpan.");
    }

    transaction.set(rewardRef, {
      contentKey,
      points: WATCH_POINTS,
      createdAt: serverTimestamp(),
    });
    transaction.update(userRef, {
      level,
      xpPoints: pointsInLevel,
      lastRewardId: rewardId,
      updatedAt: serverTimestamp(),
    });
    return "earned" as const;
  });
  return result;
}
