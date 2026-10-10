"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, Check, Clapperboard, LoaderCircle, LogOut } from "lucide-react";
import { auth, ensureAuthPersistence } from "../lib/firebase-client";
import { externalImageLoader } from "../lib/external-image-loader";
import { adminAvatarOptions, defaultAvatar, isAdminAvatar } from "../lib/avatar-options";
import { db, type ProfileData } from "../lib/firebase-profile";

const emptyProfile: ProfileData = {
  displayName: "",
  bio: "",
  gender: "Belum dipilih",
  avatarUrl: defaultAvatar,
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [avatarOptions, setAvatarOptions] = useState<readonly { id: string; label: string; src: string }[]>(adminAvatarOptions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};
    let unsubscribeUser: () => void = () => {};

    void ensureAuthPersistence()
      .then(() => {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          await currentUser.reload();
          if (!currentUser.emailVerified) {
            router.replace("/login?verify=1");
            return;
          }

          if (!active) return;
          setUser(currentUser);
          try {
            const [snapshot, catalogSnapshot] = await Promise.all([
              getDoc(doc(db, "users", currentUser.uid)),
              getDoc(doc(db, "settings", "avatarCatalog")),
            ]);
            const data = snapshot.exists() ? snapshot.data() : {};
            const catalogData = catalogSnapshot.data();
            const catalogUrls = Array.isArray(catalogData?.urls)
              ? catalogData.urls.filter((url: unknown): url is string => typeof url === "string")
              : [];
            if (active) {
              setAvatarOptions([
                ...adminAvatarOptions,
                ...catalogUrls.map((url) => ({ id: url, label: "Avatar admin", src: url })),
              ]);
            }
            if (active) {
              setProfile({
                displayName: currentUser.displayName || data.displayName || "",
                bio: typeof data.bio === "string" ? data.bio : "",
                gender: typeof data.gender === "string" ? data.gender : "Belum dipilih",
                avatarUrl: isAdminAvatar(currentUser.photoURL || data.avatarUrl || "", catalogUrls)
                  ? currentUser.photoURL || data.avatarUrl
                  : defaultAvatar,
              });
              if (data.isBanned === true) router.replace("/login?banned=1");
            }
            unsubscribeUser = onSnapshot(doc(db, "users", currentUser.uid), (userSnapshot) => {
              if (userSnapshot.data()?.isBanned === true) router.replace("/login?banned=1");
            });
          } catch {
            if (active) {
              setProfile({
                ...emptyProfile,
                displayName: currentUser.displayName || "",
                avatarUrl: isAdminAvatar(currentUser.photoURL || "") ? currentUser.photoURL! : defaultAvatar,
              });
              setError("Profil belum dapat dimuat dari Firestore. Pastikan Firestore aktif dan rules sudah diterapkan.");
            }
          } finally {
            if (active) setLoading(false);
          }
        });
      })
      .catch(() => {
        if (active) {
          setError("Tidak dapat memulihkan sesi login. Silakan masuk kembali.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
      unsubscribe();
      unsubscribeUser();
    };
  }, [router]);

  function updateField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const displayName = profile.displayName.trim();
    const bio = profile.bio.trim();
    if (!displayName) {
      setError("Nama profil harus diisi.");
      return;
    }
    if (!isAdminAvatar(profile.avatarUrl, avatarOptions.map((avatar) => avatar.src))) {
      setError("Pilih avatar dari galeri yang disediakan.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(user, { displayName, photoURL: profile.avatarUrl });
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName,
          bio,
          gender: profile.gender,
          avatarUrl: profile.avatarUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await user.reload();
      setProfile((current) => ({ ...current, displayName, bio }));
      setSuccess("Profil berhasil disimpan.");
    } catch (saveError) {
      const code = typeof saveError === "object" && saveError && "code" in saveError
        ? String(saveError.code)
        : "";
      setError(
        code === "permission-denied"
          ? "Firestore menolak penyimpanan. Terapkan firestore.rules di Firebase Console."
          : "Profil gagal disimpan. Periksa koneksi dan konfigurasi Firestore.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await (await import("firebase/auth")).signOut(auth);
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="auth-page">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Memuat profil...
        </div>
      </main>
    );
  }

  if (!user) return <main className="auth-page" />;

  return (
    <main className="profile-page">
      <header className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white" href="/">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Nobar
        </Link>
        <button className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white" onClick={logout} type="button">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </header>

      <section className="profile-panel mx-auto mt-8 w-full max-w-[980px]">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <span className="grid h-10 w-10 place-items-center rounded bg-[#e50914] text-white">
            <Clapperboard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e50914]">Nobar Tontonan</p>
            <h1 className="text-2xl font-bold">Profil saya</h1>
          </div>
        </div>

        <form className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.1fr]" onSubmit={saveProfile}>
          <fieldset>
            <legend className="text-sm font-semibold">Pilih avatar</legend>
            <p className="mt-1 text-xs text-white/45">Avatar dari koleksi yang disediakan admin.</p>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {avatarOptions.map((avatar) => {
                const selected = profile.avatarUrl === avatar.src;
                return (
                  <button
                    aria-label={`Pilih avatar ${avatar.label}`}
                    aria-pressed={selected}
                    className={`relative aspect-square overflow-hidden rounded-md border-2 transition ${selected ? "border-[#e50914] ring-2 ring-[#e50914]/25" : "border-white/10 hover:border-white/40"}`}
                    key={avatar.id}
                    onClick={() => updateField("avatarUrl", avatar.src)}
                    type="button"
                  >
                    <Image alt={avatar.label} className="object-cover" fill loader={externalImageLoader} sizes="(max-width: 640px) 28vw, 120px" src={avatar.src} unoptimized />
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#e50914] text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-5">
            <label className="auth-field-label">
              Nama tampilan
              <input className="auth-input" maxLength={60} onChange={(event) => updateField("displayName", event.target.value)} required value={profile.displayName} />
            </label>
            <label className="auth-field-label">
              Bio
              <textarea className="auth-input min-h-28 resize-y py-3" maxLength={280} onChange={(event) => updateField("bio", event.target.value)} placeholder="Ceritakan sedikit tentang diri kamu" value={profile.bio} />
              <span className="-mt-1 self-end text-[11px] font-normal text-white/40">{profile.bio.length}/280</span>
            </label>
            <label className="auth-field-label">
              Gender
              <select className="auth-input" onChange={(event) => updateField("gender", event.target.value)} value={profile.gender}>
                <option>Belum dipilih</option>
                <option>Perempuan</option>
                <option>Laki-laki</option>
                <option>Non-biner</option>
                <option>Tidak ingin menyebutkan</option>
              </select>
            </label>
            <div>
              <p className="auth-field-label">Email akun</p>
              <p className="mt-2 rounded border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/55">{user.email}</p>
            </div>
            {(error || success) && (
              <p aria-live="polite" className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
                {error || success}
              </p>
            )}
            <button className="auth-primary-button sm:w-auto sm:min-w-44" disabled={saving} type="submit">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan profil"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}