"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { AlertCircle, CheckCircle2, Clapperboard, LoaderCircle } from "lucide-react";
import { auth } from "../lib/firebase-client";

type VerificationState = "checking" | "verified" | "pending" | "error";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || undefined;
  const oobCode = searchParams.get("oobCode") || undefined;
  const [state, setState] = useState<VerificationState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        if (mode === "verifyEmail" && oobCode) {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) await auth.currentUser.reload();
          if (!cancelled) setState("verified");
          return;
        }

        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (!cancelled) setState(auth.currentUser.emailVerified ? "verified" : "pending");
          return;
        }

        if (!cancelled) setState("pending");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  const content = {
    checking: {
      icon: <LoaderCircle className="h-6 w-6 animate-spin" />,
      title: "Memeriksa verifikasi...",
      message: "Sebentar, kami sedang memeriksa status email kamu.",
    },
    verified: {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Email terverifikasi",
      message: "Akun Nobar Tontonan kamu sudah aktif. Sekarang kamu bisa masuk.",
    },
    pending: {
      icon: <Clapperboard className="h-6 w-6" />,
      title: "Cek inbox kamu",
      message: "Klik link verifikasi dari Firebase di email. Setelah itu, masuk kembali untuk mengonfirmasi akun.",
    },
    error: {
      icon: <AlertCircle className="h-6 w-6" />,
      title: "Link tidak berlaku",
      message: "Link mungkin sudah dipakai atau kedaluwarsa. Masuk untuk meminta email verifikasi baru.",
    },
  }[state];

  return (
    <div className="auth-panel w-full max-w-[440px] text-center">
      <div className={`mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full ${state === "verified" ? "bg-emerald-400/10 text-emerald-300" : state === "error" ? "bg-red-400/10 text-red-300" : "bg-white/10 text-white/75"}`}>
        {content.icon}
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e50914]">Nobar Tontonan</p>
      <h1 className="text-[28px] font-bold">{content.title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">{content.message}</p>
      {state !== "checking" && (
        <Link className="auth-primary-button mt-7" href={state === "verified" ? "/login" : "/login?verify=1"}>
          {state === "verified" ? "Masuk ke akun" : "Ke halaman masuk"}
        </Link>
      )}
    </div>
  );
}