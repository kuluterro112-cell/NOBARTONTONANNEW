"use client";

import { useEffect, useState } from "react";

type LoaderState = "visible" | "exiting" | "hidden";

export function IntroLoader() {
  const [state, setState] = useState<LoaderState>("visible");

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setState("exiting"), 1800);
    const hideTimer = window.setTimeout(() => setState("hidden"), 2200);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (state === "hidden") return null;

  return (
    <div
      aria-label="Memuat Nobar Tontonan"
      aria-live="polite"
      className={`intro-loader${state === "exiting" ? " intro-loader-exiting" : ""}`}
      role="status"
    >
      <div className="intro-loader-content">
        <p className="intro-loader-brand">Nobar Tontonan</p>
        <div aria-hidden="true" className="intro-loader-track">
          <span className="intro-loader-progress" />
        </div>
      </div>
    </div>
  );
}
