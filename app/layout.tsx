import type { Metadata } from "next";
import Script from "next/script";
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
        <Script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4943379423892555"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
