"use client";

import React, { useEffect, useState } from "react";

export function AmbientBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 1. Subtle Dot Matrix Grid (Low opacity tech pattern) */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />

      {/* 2. Primary Top-Left Electric Blue / Indigo Radial Light */}
      <div
        className={`absolute -top-40 -left-40 w-[550px] h-[550px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-br from-blue-600/12 via-indigo-600/8 to-transparent blur-[120px] will-change-transform ${
          prefersReducedMotion ? "" : "animate-ambient-drift-1"
        }`}
      />

      {/* 3. Secondary Center-Right Violet / Purple Glow */}
      <div
        className={`absolute top-1/3 -right-40 w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full bg-gradient-to-bl from-purple-600/10 via-violet-600/6 to-transparent blur-[130px] will-change-transform ${
          prefersReducedMotion ? "" : "animate-ambient-drift-2"
        }`}
      />

      {/* 4. Bottom Ambient Cyan Highlight */}
      <div
        className={`absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-600/8 via-sky-600/4 to-transparent blur-[140px] will-change-transform ${
          prefersReducedMotion ? "" : "animate-ambient-drift-3"
        }`}
      />
    </div>
  );
}
