import { Suspense } from "react";
import { VerifyEmailClient } from "../../components/verify-email-client";

export default function VerifyEmailPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<p className="text-sm text-white/60">Memeriksa verifikasi email...</p>}>
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}