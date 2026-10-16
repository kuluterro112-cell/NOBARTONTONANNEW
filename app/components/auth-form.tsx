"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, Clapperboard, LoaderCircle, MailCheck } from "lucide-react";
import { auth, ensureAuthPersistence } from "../lib/firebase-client";
import { defaultAvatar } from "../lib/avatar-options";
import { db } from "../lib/firebase-profile";

type AuthMode = "register" | "login";

function firebaseMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Email ini sudah terdaftar. Silakan masuk.",
    "auth/invalid-email": "Format email belum valid.",
    "auth/invalid-credential": "Email atau kata sandi tidak cocok.",
    "auth/user-disabled": "Akun ini dinonaktifkan. Hubungi dukungan.",
    "auth/weak-password": "Kata sandi terlalu mudah. Gunakan setidaknya 6 karakter.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat nanti.",
    "auth/network-request-failed": "Koneksi bermasalah. Periksa internet lalu coba lagi.",
    "auth/operation-not-allowed": "Metode Email/Password belum diaktifkan di Firebase Console.",
    "auth/unauthorized-continue-uri": "Domain aplikasi belum diizinkan di pengaturan Firebase Authentication.",
  };
  return messages[code] || "Terjadi kesalahan. Silakan coba lagi.";
}

function verificationSettings() {
  return {
    url: `${window.location.origin}/auth/verify-email`,
    handleCodeInApp: false,
  };
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isRegister && password !== confirmPassword) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }

    setBusy(true);
    try {
      await ensureAuthPersistence();

      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const displayName = name.trim();
        if (displayName) await updateProfile(credential.user, { displayName });
        await setDoc(doc(db, "users", credential.user.uid), {
          displayName,
          bio: "",
          gender: "Belum dipilih",
          avatarUrl: defaultAvatar,
          bannerUrl: "",
          email: credential.user.email,
          isBanned: false,
          xpPoints: 0,
          lastRewardId: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await sendEmailVerification(credential.user, verificationSettings());
        setEmailSent(true);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await credential.user.reload();

        if (!credential.user.emailVerified) {
          try {
            await sendEmailVerification(credential.user, verificationSettings());
            setNotice("Email belum terverifikasi. Tautan verifikasi baru sudah dikirim.");
          } catch {
            setNotice("Email belum terverifikasi. Buka tautan verifikasi dari email yang sudah dikirim.");
          }
          await credential.user.getIdToken(true);
          await (await import("firebase/auth")).signOut(auth);
          return;
        }

        const userDocument = await getDoc(doc(db, "users", credential.user.uid));
        if (userDocument.data()?.isBanned === true) {
          await (await import("firebase/auth")).signOut(auth);
          setError("Akun ini dibatasi oleh admin. Hubungi dukungan Nobar Tontonan.");
          return;
        }

        if (!userDocument.exists()) {
          const timestamp = serverTimestamp();
          await setDoc(doc(db, "users", credential.user.uid), {
            displayName: credential.user.displayName || "",
            bio: "",
            gender: "Belum dipilih",
            avatarUrl: credential.user.photoURL || defaultAvatar,
            bannerUrl: "",
            email: credential.user.email,
            isBanned: false,
            xpPoints: 0,
            lastRewardId: "",
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }

        router.replace("/");
      }
    } catch (submitError) {
      setError(firebaseMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  if (emailSent) {
    return (
      <div className="auth-panel w-full max-w-[440px]">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e50914]">Satu langkah lagi</p>
        <h1 className="text-[30px] font-bold leading-tight">Cek email kamu</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Link verifikasi sudah dikirim ke <strong className="text-white">{email}</strong>. Klik link itu untuk mengaktifkan akun Nobar Tontonan.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link className="auth-primary-button" href="/auth/verify-email">
            Saya sudah klik link verifikasi
          </Link>
          <button
            className="auth-secondary-button"
            onClick={async () => {
              if (!auth.currentUser) {
                setError("Masuk kembali untuk meminta link verifikasi baru.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                await sendEmailVerification(auth.currentUser, verificationSettings());
                setNotice("Link verifikasi baru sudah dikirim.");
              } catch (resendError) {
                setError(firebaseMessage(resendError));
              } finally {
                setBusy(false);
              }
            }}
            type="button"
          >
            {busy ? "Mengirim..." : "Kirim ulang email"}
          </button>
          {notice && <p aria-live="polite" className="text-sm text-emerald-300">{notice}</p>}
          {error && <p aria-live="polite" className="text-sm text-red-300">{error}</p>}
        </div>
        <p className="mt-6 text-center text-sm text-white/55">
          Salah memasukkan email? <Link className="text-white underline underline-offset-4" href="/register">Daftar ulang</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-panel w-full max-w-[440px]">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#e50914]/10 text-[#f0444b]">
        {isRegister ? <Clapperboard className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e50914]">Nobar Tontonan</p>
      <h1 className="text-[30px] font-bold leading-tight">{isRegister ? "Buat akun" : "Selamat datang kembali"}</h1>
      <p className="mt-2 text-sm text-white/55">
        {isRegister ? "Daftar dulu, lalu verifikasi email untuk mengaktifkan akun." : "Masuk dengan email yang sudah terverifikasi."}
      </p>

      <form className="mt-7 space-y-4" onSubmit={submit}>
        {isRegister && (
          <label className="auth-field-label">
            Nama
            <input autoComplete="name" className="auth-input" onChange={(event) => setName(event.target.value)} placeholder="Nama kamu" value={name} />
          </label>
        )}
        <label className="auth-field-label">
          Email
          <input autoComplete="email" className="auth-input" onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required type="email" value={email} />
        </label>
        <label className="auth-field-label">
          Kata sandi
          <input autoComplete={isRegister ? "new-password" : "current-password"} className="auth-input" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 6 karakter" required type="password" value={password} />
        </label>
        {isRegister && (
          <label className="auth-field-label">
            Ulangi kata sandi
            <input autoComplete="new-password" className="auth-input" minLength={6} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Masukkan ulang kata sandi" required type="password" value={confirmPassword} />
          </label>
        )}

        {(error || notice) && (
          <div aria-live="polite" className={`flex items-start gap-2 text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
            {error && <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}
            <p>{error || notice}</p>
          </div>
        )}

        <button className="auth-primary-button" disabled={busy} type="submit">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Memproses..." : isRegister ? "Daftar dan kirim verifikasi" : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/55">
        {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link className="font-semibold text-white underline underline-offset-4" href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Masuk" : "Daftar"}
        </Link>
      </p>
      <p className="mt-5 text-center text-xs leading-5 text-white/35">
        Dengan melanjutkan, kamu menyetujui ketentuan penggunaan Nobar Tontonan.
      </p>
    </div>
  );
}