"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Clapperboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, ensureAuthPersistence } from "../lib/firebase-client";
import { isAdminEmail } from "../lib/admin-emails";
import { externalImageLoader } from "../lib/external-image-loader";
import { db } from "../lib/firebase-profile";

const links = [
  { label: "Home", href: "#home" },
  { label: "TV Shows", href: "#tv-shows" },
  { label: "Anime", href: "#anime" },
  { label: "Movies", href: "#movies" },
  { label: "New & Popular", href: "#trending" },
  { label: "My List", href: "#my-list" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const homePath = pathname === "/" ? "" : "/";
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const syncSearch = () => {
      const query = new URLSearchParams(window.location.search).get("q") || "";
      setSearch(query);
      setSearchOpen(Boolean(query));
    };
    syncSearch();
    window.addEventListener("popstate", syncSearch);
    return () => window.removeEventListener("popstate", syncSearch);
  }, []);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 32);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    let unsubscribeAccount: () => void = () => {};
    void ensureAuthPersistence().then(() => {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        unsubscribeAccount();
        if (!currentUser?.emailVerified) {
          setUser(null);
          setIsAdmin(false);
          return;
        }
        setUser(currentUser);
        setIsAdmin(isAdminEmail(currentUser.email));
        unsubscribeAccount = onSnapshot(doc(db, "users", currentUser.uid), (snapshot) => {
          if (snapshot.data()?.isBanned === true) {
            void signOut(auth);
            setUser(null);
            setIsAdmin(false);
          }
        });
      });
    });
    return () => {
      unsubscribe();
      unsubscribeAccount();
    };
  }, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          scrolled ? "bg-[#141414]" : "bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-8 px-5 sm:px-8 lg:px-14">
          <a
            aria-label="Nobar Tontonan beranda"
            className="flex shrink-0 items-center gap-2 text-[21px] font-black tracking-[-0.7px] text-[#e50914] sm:text-[25px]"
            href={homePath || "#home"}
          >
            <Clapperboard aria-hidden="true" className="h-6 w-6 stroke-[2.7]" />
            <span>Nobar Tontonan</span>
          </a>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-5 lg:flex">
            {links.map((link, index) => (
              <a
                className={`text-[13px] transition-colors hover:text-white ${
                  index === 0 ? "font-semibold text-white" : "text-white/70"
                }`}
                href={`${homePath}${link.href}`}
                key={link.label}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 text-white sm:gap-5">
            <form className={`search-shell ${searchOpen ? "search-shell-open" : ""}`} onSubmit={submitSearch}>
              <button
                aria-label={searchOpen ? "Tutup pencarian" : "Cari tontonan"}
                className="grid h-9 w-9 place-items-center"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  if (searchOpen) setSearch("");
                }}
                type="button"
              >
                {searchOpen ? <X size={20} /> : <Search size={21} />}
              </button>
              <input
                aria-label="Cari judul atau genre"
                className="w-0 bg-transparent text-sm opacity-0 outline-none transition-all duration-200 focus:ring-0"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && !search) setSearchOpen(false);
                }}
                placeholder="Cari judul..."
                value={search}
              />
            </form>

            <div className="relative hidden sm:block">
              <button
                aria-expanded={notificationsOpen}
                aria-label="Notifikasi"
                className="grid h-9 w-9 place-items-center transition-transform hover:scale-105"
                onClick={() => setNotificationsOpen((open) => !open)}
                type="button"
              >
                <Bell size={20} />
                <span className="absolute right-[5px] top-[5px] h-[6px] w-[6px] rounded-full bg-[#e50914] ring-2 ring-[#141414]" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-[290px] border border-white/15 bg-[#181818] p-4 shadow-2xl">
                  <p className="text-sm font-semibold">Kabar terbaru</p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/65">
                    Pilihan tontonan minggu ini sudah hadir. Temukan cerita baru untuk malam ini.
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                aria-expanded={profileMenuOpen}
                aria-label={user ? `Profil ${user.displayName || user.email}` : "Masuk atau daftar akun Nobar"}
                className="flex items-center gap-1.5"
                onClick={() => user ? setProfileMenuOpen((open) => !open) : router.push("/login")}
                type="button"
              >
                {user?.photoURL ? (
                  <Image alt="" className="rounded object-cover" height={32} loader={externalImageLoader} src={user.photoURL} unoptimized width={32} />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded bg-[#d64b48] text-sm font-bold text-white">
                    {user?.displayName?.[0]?.toUpperCase() || "N"}
                  </span>
                )}
                <ChevronDown aria-hidden="true" className="hidden h-4 w-4 sm:block" />
              </button>
              {user && profileMenuOpen && (
                <div className="absolute right-0 top-12 w-56 border border-white/15 bg-[#181818] p-2 shadow-2xl">
                  <Link
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/85 hover:bg-white/10"
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <UserRound className="h-4 w-4" />
                    {user.displayName || "Profil saya"}
                  </Link>
                  {isAdmin && (
                    <Link
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/85 hover:bg-white/10"
                      href="/admin"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <ShieldCheck className="h-4 w-4" /> Admin panel
                    </Link>
                  )}
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/10"
                    onClick={async () => {
                      await signOut(auth);
                      setProfileMenuOpen(false);
                      router.push("/");
                    }}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
                </div>
              )}
            </div>

            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              className="grid h-9 w-9 place-items-center lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Navigasi mobile"
            className="absolute inset-x-0 top-full border-t border-white/10 bg-[#141414] px-6 py-3 shadow-xl lg:hidden"
          >
            {links.map((link) => (
              <a
                className="flex items-center gap-3 border-b border-white/[0.06] py-3.5 text-sm text-white/80 last:border-0"
                href={`${homePath}${link.href}`}
                key={link.label}
                onClick={() => setMenuOpen(false)}
              >
                <UserRound aria-hidden="true" className="h-4 w-4 text-white/35" />
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}