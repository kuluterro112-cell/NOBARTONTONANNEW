import Link from "next/link";
import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Link aria-label="Nobar Tontonan beranda" className="auth-brand" href="/">
        <span className="grid h-8 w-8 place-items-center rounded bg-[#e50914] text-white">N</span>
        <span>Nobar Tontonan</span>
      </Link>
      <AuthForm mode="login" />
    </main>
  );
}