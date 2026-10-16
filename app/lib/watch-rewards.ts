import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth } from "./firebase-client";
import { db } from "./firebase-profile";
import { WATCH_POINTS } from "./points";

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
): Promise<"earned" | "already-earned" | "unauthenticated"> {
  const user = auth.currentUser;
  if (!user) return "unauthenticated";

  const userRef = doc(db, "users", user.uid);
  const rewardId = rewardDocumentId(contentKey);
  const rewardRef = doc(db, "users", user.uid, "watchRewards", rewardId);

  const earned = await runTransaction(db, async (transaction) => {
    const [userSnapshot, rewardSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(rewardRef),
    ]);

    if (rewardSnapshot.exists()) return false;
    if (!userSnapshot.exists()) {
      throw new Error("Profil pengguna tidak ditemukan; poin tontonan tidak dapat disimpan.");
    }

    const currentPoints = userSnapshot.data().xpPoints ?? 0;
    if (!Number.isSafeInteger(currentPoints) || currentPoints < 0) {
      throw new Error("Data poin pengguna tidak valid; poin tontonan tidak dapat disimpan.");
    }

    transaction.set(rewardRef, {
      contentKey,
      points: WATCH_POINTS,
      createdAt: serverTimestamp(),
    });
    transaction.update(userRef, {
      xpPoints: currentPoints + WATCH_POINTS,
      lastRewardId: rewardId,
      updatedAt: serverTimestamp(),
    });
    return true;
  });
  return earned ? "earned" : "already-earned";
}
