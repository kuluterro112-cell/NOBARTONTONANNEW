"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  Ban,
  Check,
  ExternalLink,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { auth, ensureAuthPersistence } from "../lib/firebase-client";
import { externalImageLoader } from "../lib/external-image-loader";
import { isAdminEmail } from "../lib/admin-emails";
import { isHttpsVideoUrl } from "../lib/banner-options";
import { db } from "../lib/firebase-profile";

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  isBanned: boolean;
  avatarUrl: string;
  bannerUrl: string;
};

type AccessState = "loading" | "ready" | "denied";

function isHttpsImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && value.length <= 2048;
  } catch {
    return false;
  }
}

export function AdminPanel() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [access, setAccess] = useState<AccessState>("loading");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [bannerUrls, setBannerUrls] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [search, setSearch] = useState("");
  const [busyUrl, setBusyUrl] = useState("");
  const [busyBannerUrl, setBusyBannerUrl] = useState("");
  const [busyUser, setBusyUser] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshData() {
    setLoadingData(true);
    setError("");
    try {
      const [usersSnapshot, avatarsSnapshot, bannersSnapshot] = await Promise.all([
        getDocs(collection(db, "users")),
        getDoc(doc(db, "settings", "avatarCatalog")),
        getDoc(doc(db, "settings", "profileBannerCatalog")),
      ]);
      setUsers(
        usersSnapshot.docs.map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            email: typeof data.email === "string" ? data.email : "Email tidak tersedia",
            displayName: typeof data.displayName === "string" && data.displayName
              ? data.displayName
              : "Tanpa nama",
            isBanned: data.isBanned === true,
            avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : "",
            bannerUrl: typeof data.bannerUrl === "string" ? data.bannerUrl : "",
          };
        }),
      );
      const urls = avatarsSnapshot.data()?.urls;
      setAvatarUrls(Array.isArray(urls) ? urls.filter((url): url is string => typeof url === "string") : []);
      const videoUrls = bannersSnapshot.data()?.urls;
      setBannerUrls(
        Array.isArray(videoUrls)
          ? videoUrls.filter((url): url is string => typeof url === "string" && isHttpsVideoUrl(url))
          : [],
      );
    } catch (loadError) {
      const code = typeof loadError === "object" && loadError && "code" in loadError
        ? String(loadError.code)
        : "";
      setError(
        code === "permission-denied"
          ? "Akses ditolak. Pastikan email admin cocok dan firestore.rules sudah diterapkan."
          : "Data admin gagal dimuat. Periksa koneksi dan status Firestore.",
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};

    void ensureAuthPersistence().then(() => {
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

        setAccess("loading");
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        if (!active) return;
        if (!isAdminEmail(currentUser.email)) {
          setAccess("denied");
          return;
        }

        setAdminUser(currentUser);
        setAccess("ready");
        await refreshData();
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    if (!query) return users;
    return users.filter((user) => `${user.displayName} ${user.email}`.toLocaleLowerCase("id-ID").includes(query));
  }, [search, users]);

  async function addAvatar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = avatarUrl.trim();
    if (!isHttpsImageUrl(url)) {
      setError("Masukkan URL gambar HTTPS yang valid.");
      return;
    }
    if (avatarUrls.includes(url)) {
      setError("Link avatar ini sudah ada di katalog.");
      return;
    }

    setBusyUrl(url);
    setError("");
    setNotice("");
    try {
      const isImage = await new Promise<boolean>((resolve) => {
        const probe = new window.Image();
        probe.onload = () => resolve(true);
        probe.onerror = () => resolve(false);
        probe.src = url;
      });
      if (!isImage) {
        setError("Gambar tidak bisa dimuat. Gunakan link langsung ke file gambar yang bisa diakses publik.");
        return;
      }

      await setDoc(
        doc(db, "settings", "avatarCatalog"),
        { urls: arrayUnion(url), updatedAt: serverTimestamp() },
        { merge: true },
      );
      setAvatarUrls((current) => [...current, url]);
      setAvatarUrl("");
      setNotice("Avatar berhasil ditambahkan ke pilihan pengguna.");
    } catch {
      setError("Avatar gagal disimpan. Pastikan Firestore aktif dan akun ini memiliki akses admin.");
    } finally {
      setBusyUrl("");
    }
  }

  async function removeAvatar(url: string) {
    const assigned = users.some((user) => user.avatarUrl === url);
    if (assigned) {
      setError("Avatar ini masih dipakai pengguna. Pilih avatar lain untuk mereka sebelum menghapusnya.");
      return;
    }

    setBusyUrl(url);
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "settings", "avatarCatalog"), {
        urls: arrayRemove(url),
        updatedAt: serverTimestamp(),
      });
      setAvatarUrls((current) => current.filter((item) => item !== url));
      setNotice("Avatar dihapus dari katalog.");
    } catch {
      setError("Avatar gagal dihapus. Periksa aturan akses Firestore.");
    } finally {
      setBusyUrl("");
    }
  }

  async function addBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = bannerUrl.trim();
    if (!isHttpsVideoUrl(url)) {
      setError("Masukkan URL video HTTPS langsung berformat MP4, WebM, atau OGG.");
      return;
    }
    if (bannerUrls.includes(url)) {
      setError("Link banner ini sudah ada di katalog.");
      return;
    }
    if (bannerUrls.length >= 100) {
      setError("Katalog sudah mencapai batas 100 banner. Hapus banner lama sebelum menambahkan yang baru.");
      return;
    }

    setBusyBannerUrl(url);
    setError("");
    setNotice("");
    try {
      await setDoc(
        doc(db, "settings", "profileBannerCatalog"),
        { urls: arrayUnion(url), updatedAt: serverTimestamp() },
        { merge: true },
      );
      setBannerUrls((current) => [...current, url]);
      setBannerUrl("");
      setNotice("Banner video berhasil ditambahkan ke pilihan pengguna.");
    } catch {
      setError("Banner gagal disimpan. Pastikan Firestore aktif dan akun ini memiliki akses admin.");
    } finally {
      setBusyBannerUrl("");
    }
  }

  async function removeBanner(url: string) {
    if (users.some((user) => user.bannerUrl === url)) {
      setError("Banner ini masih dipakai pengguna. Minta mereka memilih banner lain sebelum menghapusnya.");
      return;
    }

    setBusyBannerUrl(url);
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "settings", "profileBannerCatalog"), {
        urls: arrayRemove(url),
        updatedAt: serverTimestamp(),
      });
      setBannerUrls((current) => current.filter((item) => item !== url));
      setNotice("Banner dihapus dari katalog.");
    } catch {
      setError("Banner gagal dihapus. Periksa aturan akses Firestore.");
    } finally {
      setBusyBannerUrl("");
    }
  }

  async function toggleBan(user: AdminUser) {
    if (user.id === adminUser?.uid) {
      setError("Admin tidak bisa membatasi akunnya sendiri.");
      return;
    }

    setBusyUser(user.id);
    setError("");
    setNotice("");
    try {
      const isBanned = !user.isBanned;
      await updateDoc(doc(db, "users", user.id), {
        isBanned,
        updatedAt: serverTimestamp(),
      });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isBanned } : item));
      setNotice(isBanned ? `Akun ${user.email} dibatasi.` : `Akun ${user.email} diaktifkan kembali.`);
    } catch {
      setError("Status akun gagal diubah. Pastikan Firestore rules sudah dipublikasikan.");
    } finally {
      setBusyUser("");
    }
  }

  async function logout() {
    await signOut(auth);
    router.replace("/");
  }

  if (access === "loading") {
    return (
      <main className="admin-page">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Memeriksa kecocokan email admin...
        </div>
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="admin-page">
        <section className="admin-card mx-auto max-w-lg text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#e50914]" />
          <h1 className="mt-4 text-2xl font-bold">Akses admin diperlukan</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">Email akun ini tidak ada di allowlist admin aplikasi.</p>
          <Link className="auth-primary-button mt-6" href="/">Kembali ke Nobar</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="mb-4 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white" href="/">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Nobar
            </Link>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e50914]">Nobar Tontonan</p>
            <h1 className="mt-1 text-3xl font-bold">Admin panel</h1>
            <p className="mt-1 text-sm text-white/50">Kelola avatar, banner video, dan akun pengguna.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/50 sm:block">{adminUser?.email}</span>
            <button className="auth-secondary-button !w-auto" onClick={logout} type="button">Keluar</button>
          </div>
        </header>

        <section className="admin-card mt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Katalog banner profil</h2>
              <p className="mt-1 text-xs text-white/45">Tambahkan link HTTPS langsung ke video MP4, WebM, atau OGG yang di-host publik.</p>
            </div>
            <span className="text-sm text-white/45">{bannerUrls.length} pilihan</span>
          </div>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={addBanner}>
            <label className="auth-field-label min-w-0 flex-1">
              Link video banner
              <input
                className="auth-input"
                onChange={(event) => setBannerUrl(event.target.value)}
                placeholder="https://domain.com/banner.mp4"
                required
                type="url"
                value={bannerUrl}
              />
            </label>
            <button className="auth-primary-button self-end sm:w-auto" disabled={Boolean(busyBannerUrl)} type="submit">
              {busyBannerUrl && busyBannerUrl === bannerUrl.trim()
                ? <LoaderCircle className="h-4 w-4 animate-spin" />
                : <Plus className="h-4 w-4" />}
              Tambahkan banner
            </button>
          </form>
          {isHttpsVideoUrl(bannerUrl.trim()) && (
            <video
              aria-label="Pratinjau banner video"
              className="mt-4 aspect-video max-h-48 rounded border border-white/10 bg-black object-cover"
              controls
              muted
              playsInline
              preload="metadata"
              src={bannerUrl.trim()}
            />
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bannerUrls.map((url) => (
              <div className="group relative aspect-video overflow-hidden rounded border border-white/10 bg-black/30" key={url}>
                <video autoPlay className="h-full w-full object-cover" loop muted playsInline preload="metadata" src={url} />
                <button
                  aria-label="Hapus banner dari katalog"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded bg-black/75 text-white transition hover:bg-red-700"
                  disabled={Boolean(busyBannerUrl)}
                  onClick={() => void removeBanner(url)}
                  type="button"
                >
                  {busyBannerUrl === url ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
                <a aria-label="Buka sumber video" className="absolute bottom-2 left-2 grid h-8 w-8 place-items-center rounded bg-black/75 text-white" href={url} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
            {bannerUrls.length === 0 && <p className="col-span-full py-5 text-center text-sm text-white/40">Belum ada banner video di katalog.</p>}
          </div>
        </section>

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Katalog avatar</h2>
                <p className="mt-1 text-xs text-white/45">Link HTTPS langsung ke gambar publik.</p>
              </div>
              <span className="text-sm text-white/45">{avatarUrls.length} pilihan</span>
            </div>

            <form className="mt-5" onSubmit={addAvatar}>
              <label className="auth-field-label">
                Masukan link avatar disini
                <input
                  className="auth-input"
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://domain.com/avatar.jpg"
                  required
                  type="url"
                  value={avatarUrl}
                />
              </label>
              {isHttpsImageUrl(avatarUrl.trim()) && (
                <div className="mt-3 flex items-center gap-3 rounded border border-white/10 bg-black/20 p-2">
                  <Image alt="Preview avatar" className="rounded object-cover" height={48} loader={externalImageLoader} src={avatarUrl.trim()} unoptimized width={48} />
                  <span className="min-w-0 truncate text-xs text-white/50">Preview avatar</span>
                </div>
              )}
              <button className="auth-primary-button mt-3" disabled={Boolean(busyUrl)} type="submit">
                {busyUrl && busyUrl === avatarUrl.trim()
                  ? <LoaderCircle className="h-4 w-4 animate-spin" />
                  : <Plus className="h-4 w-4" />}
                Tambahkan avatar
              </button>
            </form>

            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {avatarUrls.map((url) => (
                <div className="group relative aspect-square overflow-hidden rounded border border-white/10 bg-black/30" key={url}>
                  <Image alt="Avatar katalog" className="object-cover" fill loader={externalImageLoader} sizes="100px" src={url} unoptimized />
                  <button
                    aria-label="Hapus avatar dari katalog"
                    className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded bg-black/75 text-white opacity-100 transition hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                    disabled={Boolean(busyUrl)}
                    onClick={() => void removeAvatar(url)}
                    type="button"
                  >
                    {busyUrl === url ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                  <a aria-label="Buka sumber gambar" className="absolute bottom-1 left-1 grid h-7 w-7 place-items-center rounded bg-black/75 text-white" href={url} rel="noreferrer" target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
              {avatarUrls.length === 0 && <p className="col-span-full py-6 text-center text-sm text-white/40">Belum ada avatar custom.</p>}
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><UsersRound className="h-5 w-5 text-white/55" /> Pengguna</h2>
                <p className="mt-1 text-xs text-white/45">{users.length} akun terdaftar · {users.filter((user) => user.isBanned).length} dibatasi</p>
              </div>
              <button aria-label="Muat ulang pengguna" className="auth-secondary-button !min-h-9 !w-auto" disabled={loadingData} onClick={() => void refreshData()} type="button">
                {loadingData ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Muat ulang"}
              </button>
            </div>

            <label className="auth-field-label mt-5">
              Cari pengguna
              <input className="auth-input" onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau email" value={search} />
            </label>

            <div className="mt-4 max-h-[480px] divide-y divide-white/[0.08] overflow-y-auto">
              {visibleUsers.map((user) => (
                <article className="flex items-center justify-between gap-3 py-3" key={user.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    {user.avatarUrl ? (
                      <Image alt="" className="h-10 w-10 shrink-0 rounded object-cover" height={40} loader={externalImageLoader} src={user.avatarUrl} unoptimized width={40} />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-white/10 text-sm">{user.displayName[0]?.toUpperCase()}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.displayName}</p>
                      <p className="truncate text-xs text-white/45">{user.email}</p>
                      <p className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${user.isBanned ? "text-red-300" : "text-emerald-300"}`}>
                        {user.isBanned ? "Dibatasi" : "Aktif"}
                      </p>
                    </div>
                  </div>
                  <button
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded border ${user.isBanned ? "border-emerald-300/25 text-emerald-300 hover:bg-emerald-300/10" : "border-red-300/25 text-red-300 hover:bg-red-300/10"}`}
                    disabled={busyUser === user.id || user.id === adminUser?.uid}
                    onClick={() => void toggleBan(user)}
                    title={user.isBanned ? "Aktifkan akun" : "Batasi akun"}
                    type="button"
                  >
                    {busyUser === user.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : user.isBanned ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </button>
                </article>
              ))}
              {visibleUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-white/40">{loadingData ? "Memuat pengguna..." : "Pengguna tidak ditemukan."}</p>
              )}
            </div>
          </section>
        </div>

        {(error || notice) && (
          <p aria-live="polite" className={`mt-4 rounded border px-4 py-3 text-sm ${error ? "border-red-300/20 bg-red-300/5 text-red-200" : "border-emerald-300/20 bg-emerald-300/5 text-emerald-200"}`}>
            {error || notice}
          </p>
        )}
      </div>
    </main>
  );
}