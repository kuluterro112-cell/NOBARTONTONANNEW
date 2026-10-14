"use client";

import { useEffect, useState } from "react";

type LoaderState = "visible" | "exiting" | "hidden";

export function IntroLoader() {
  const [state, setState] = useState<LoaderState>("visible");

  useEffect(() => {
    let exitTimer = 0;
    let hideTimer = 0;
    let fallbackTimer = 0;
    let active = true;

    const exitLoader = () => {
      if (!active) return;
      setState("exiting");
      hideTimer = window.setTimeout(() => setState("hidden"), 400);
    };

    const loadPromise = document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
    const fontsPromise = document.fonts?.ready.then(() => undefined) ?? Promise.resolve();

    Promise.all([loadPromise, fontsPromise]).then(() => {
      if (active) exitTimer = window.setTimeout(exitLoader, 1800);
    });
    fallbackTimer = window.setTimeout(exitLoader, 10000);

    return () => {
      active = false;
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(fallbackTimer);
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
