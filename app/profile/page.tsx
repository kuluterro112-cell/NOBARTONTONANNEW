"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, Check, Clapperboard, LoaderCircle, LogOut } from "lucide-react";
import { auth, ensureAuthPersistence } from "../lib/firebase-client";
import { externalImageLoader } from "../lib/external-image-loader";
import { adminAvatarOptions, defaultAvatar, isAdminAvatar } from "../lib/avatar-options";
import { isHttpsVideoUrl } from "../lib/banner-options";
import { ProfileBannerMedia } from "../components/profile-banner-media";
import { db, type ProfileData } from "../lib/firebase-profile";
import { getLevelProgress } from "../lib/points";

const emptyProfile: ProfileData = {
  displayName: "",
  bio: "",
  gender: "Belum dipilih",
  avatarUrl: defaultAvatar,
  bannerUrl: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [xpPoints, setXpPoints] = useState(0);
  const [avatarOptions, setAvatarOptions] = useState<readonly { id: string; label: string; src: string }[]>(adminAvatarOptions);
  const [bannerOptions, setBannerOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const editRevision = useRef(0);
  const pendingSave = useRef(false);

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
            const [snapshot, catalogSnapshot, bannerCatalogSnapshot] = await Promise.all([
              getDoc(doc(db, "users", currentUser.uid)),
              getDoc(doc(db, "settings", "avatarCatalog")),
              getDoc(doc(db, "settings", "profileBannerCatalog")),
            ]);
            const data = snapshot.exists() ? snapshot.data() : {};
            setXpPoints(typeof data.xpPoints === "number" ? data.xpPoints : 0);
            const catalogData = catalogSnapshot.data();
            const catalogUrls = Array.isArray(catalogData?.urls)
              ? catalogData.urls.filter((url: unknown): url is string => typeof url === "string")
              : [];
            const bannerUrls = bannerCatalogSnapshot.data()?.urls;
            const availableBanners = Array.isArray(bannerUrls)
              ? bannerUrls.filter((url: unknown): url is string => typeof url === "string" && isHttpsVideoUrl(url))
              : [];
            if (active) {
              setAvatarOptions([
                ...adminAvatarOptions,
                ...catalogUrls.map((url) => ({ id: url, label: "Avatar admin", src: url })),
              ]);
              setBannerOptions(availableBanners);
            }
            if (active) {
              setProfile({
                displayName: currentUser.displayName || data.displayName || "",
                bio: typeof data.bio === "string" ? data.bio : "",
                gender: typeof data.gender === "string" ? data.gender : "Belum dipilih",
                avatarUrl: isAdminAvatar(currentUser.photoURL || data.avatarUrl || "", catalogUrls)
                  ? currentUser.photoURL || data.avatarUrl
                  : defaultAvatar,
                bannerUrl: typeof data.bannerUrl === "string" && availableBanners.includes(data.bannerUrl)
                  ? data.bannerUrl
                  : "",
              });
              if (data.isBanned === true) router.replace("/login?banned=1");
            }
            unsubscribeUser = onSnapshot(doc(db, "users", currentUser.uid), (userSnapshot) => {
              const userData = userSnapshot.data();
              if (userData?.isBanned === true) router.replace("/login?banned=1");
              setXpPoints(typeof userData?.xpPoints === "number" ? userData.xpPoints : 0);
            });
          } catch {
            if (active) {
              setProfile({
                ...emptyProfile,
                displayName: currentUser.displayName || "",
                avatarUrl: isAdminAvatar(currentUser.photoURL || "") ? currentUser.photoURL! : defaultAvatar,
              });
              setBannerOptions([]);
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
    editRevision.current += 1;
    pendingSave.current = true;
    setProfile((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  useEffect(() => {
    if (loading || !user || !pendingSave.current) return;

    const revision = editRevision.current;
    const timer = window.setTimeout(() => {
      const displayName = profile.displayName.trim();
      const bio = profile.bio.trim();
      if (!displayName) {
        setError("Nama profil harus diisi sebelum perubahan bisa disimpan.");
        return;
      }
      if (!isAdminAvatar(profile.avatarUrl, avatarOptions.map((avatar) => avatar.src))) {
        setError("Pilih avatar dari galeri yang disediakan.");
        return;
      }

      setSaving(true);
      setError("");
      setSuccess("");
      void (async () => {
        try {
          await updateProfile(user, { displayName, photoURL: profile.avatarUrl });
          await setDoc(
            doc(db, "users", user.uid),
            {
              displayName,
              bio,
              gender: profile.gender,
              avatarUrl: profile.avatarUrl,
              bannerUrl: profile.bannerUrl,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
          if (editRevision.current === revision) {
            pendingSave.current = false;
            setProfile((current) => ({ ...current, displayName, bio }));
            setSuccess("Perubahan profil tersimpan otomatis.");
          }
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
      })();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [avatarOptions, loading, profile, user]);

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

  const levelProgress = getLevelProgress(xpPoints);
  const progressPercent = (levelProgress.pointsInLevel / levelProgress.pointsForNextLevel) * 100;

  return (
    <main className="profile-page">
      <header className="mx-auto flex w-full items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white" href="/">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Nobar
        </Link>
        <button className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white" onClick={logout} type="button">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </header>

      <section className="profile-panel mx-auto mt-8 w-full !p-0">
        <div className="relative mb-20">
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#50171b] via-[#222] to-black sm:h-64">
            {profile.bannerUrl && (
              <ProfileBannerMedia
                className="absolute inset-0 h-full w-full object-cover"
                url={profile.bannerUrl}
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
          </div>
          <div className="absolute -bottom-14 left-6 h-28 w-28 overflow-hidden rounded-full border-[5px] border-[#181818] bg-[#262626] shadow-xl sm:left-10 sm:h-36 sm:w-36">
            <Image
              alt={profile.displayName ? `Avatar ${profile.displayName}` : "Avatar profil"}
              className="object-cover"
              fill
              loader={externalImageLoader}
              sizes="144px"
              src={profile.avatarUrl}
              unoptimized
            />
          </div>
          <div className="absolute bottom-2 left-36 right-5 min-w-0 sm:bottom-4 sm:left-52">
            <h1 className="truncate text-xl font-bold text-white drop-shadow sm:text-2xl">
              {profile.displayName || "Profil saya"}
            </h1>
            <p className="mt-1 text-xs text-white/60">Nobar Tontonan</p>
          </div>
        </div>

        <div className="px-5 pb-7 sm:px-9 sm:pb-9">
        <section aria-label="Level tontonan" className="mb-7 rounded-lg border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e50914]">Level tontonan</p>
              <h2 className="mt-1 text-2xl font-black">Level {levelProgress.level}</h2>
            </div>
            <p className="text-sm text-white/65">
              {levelProgress.pointsInLevel} / {levelProgress.pointsForNextLevel} poin ke level {levelProgress.level + 1}
            </p>
          </div>
          <div
            aria-label={`${Math.min(100, progressPercent).toFixed(0)}% menuju level ${levelProgress.level + 1}`}
            className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemax={levelProgress.pointsForNextLevel}
            aria-valuemin={0}
            aria-valuenow={levelProgress.pointsInLevel}
          >
            <div
              className="h-full rounded-full bg-[#e50914] transition-[width] duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/45">
            Total {levelProgress.totalPoints} poin · 150 poin untuk setiap film atau episode anime baru.
          </p>
        </section>
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <span className="grid h-10 w-10 place-items-center rounded bg-[#e50914] text-white">
            <Clapperboard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e50914]">Nobar Tontonan</p>
            <h2 className="text-2xl font-bold">Edit profil</h2>
          </div>
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
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
            <fieldset>
              <legend className="text-sm font-semibold">Banner profil animasi</legend>
              <p className="mt-1 text-xs text-white/45">Pilih banner video yang disediakan admin.</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  aria-pressed={!profile.bannerUrl}
                  className={`grid aspect-video place-items-center rounded-md border-2 bg-black/30 text-xs text-white/60 transition ${!profile.bannerUrl ? "border-[#e50914] ring-2 ring-[#e50914]/25" : "border-white/10 hover:border-white/40"}`}
                  onClick={() => updateField("bannerUrl", "")}
                  type="button"
                >
                  Tanpa banner
                </button>
                {bannerOptions.map((url, index) => {
                  const selected = profile.bannerUrl === url;
                  return (
                    <button
                      aria-label={`Pilih banner ${index + 1}`}
                      aria-pressed={selected}
                      className={`relative aspect-video overflow-hidden rounded-md border-2 transition ${selected ? "border-[#e50914] ring-2 ring-[#e50914]/25" : "border-white/10 hover:border-white/40"}`}
                      key={url}
                      onClick={() => updateField("bannerUrl", url)}
                      type="button"
                    >
                      <ProfileBannerMedia className="h-full w-full object-cover" previewOnly url={url} />
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#e50914] text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {bannerOptions.length === 0 && <p className="mt-2 text-xs text-white/40">Belum ada banner dari admin.</p>}
            </fieldset>
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
            <p aria-live="polite" className={`flex items-center gap-2 text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {error || (saving ? "Menyimpan perubahan..." : success || "Perubahan disimpan otomatis.")}
            </p>
          </div>
        </div>
        </div>
      </section>
    </main>
  );
}