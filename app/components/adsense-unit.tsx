"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

export function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!adRef.current || requested.current) return;
    requested.current = true;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  }, []);

  return (
    <aside aria-label="Iklan" className="mx-auto my-8 w-full max-w-[970px] sm:my-10">
      <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-white/40">Iklan</p>
      <ins
        className="adsbygoogle"
        data-ad-client="ca-pub-4943379423892555"
        data-ad-format="auto"
        data-ad-slot="6391753109"
        data-full-width-responsive="true"
        ref={adRef}
        style={{ display: "block", minHeight: 100 }}
      />
    </aside>
  );
}
