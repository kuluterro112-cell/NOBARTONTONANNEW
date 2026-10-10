import { getFirestore } from "firebase/firestore";
import { auth } from "./firebase-client";

export const db = getFirestore(auth.app);

export type ProfileData = {
  displayName: string;
  bio: string;
  gender: string;
  avatarUrl: string;
};