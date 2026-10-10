import type { Metadata } from "next";
import { IntroLoader } from "./components/intro-loader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nobar Tontonan | Cerita dimulai di sini",
  description: "Jelajahi film dan serial pilihan untuk malam yang lebih seru.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <IntroLoader />
        {children}
      </body>
    </html>
  );
}
