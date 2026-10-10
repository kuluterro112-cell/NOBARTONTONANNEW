"use client";

import Image from "next/image";
import { Info, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "../lib/movies";

type HeroProps = {
  movie: Movie;
  onMoreInfo: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
};

export function Hero({ movie, onMoreInfo, onPlay }: HeroProps) {
  return (
    <section
      aria-label="Pilihan utama"
      className="relative flex min-h-[620px] items-end overflow-hidden pb-24 pt-28 sm:min-h-[700px] sm:pb-32 lg:min-h-[790px] lg:pb-[150px]"
      id="home"
    >
      <Image
        alt=""
        className="object-cover object-[58%_32%]"
        fill
        unoptimized
        loading="eager"
        sizes="100vw"
        src={movie.backdrop}
      />
      <div className="hero-shade absolute inset-0" />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-14"
        initial={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
          <span className="h-[18px] w-[3px] bg-[#e50914]" />
          Pilihan Nobar minggu ini
        </p>
        <h1 className="max-w-3xl text-[42px] font-black leading-[0.97] tracking-[-1.5px] text-white sm:text-6xl lg:text-[76px]">
          {movie.title}
        </h1>
        <div className="mt-5 flex items-center gap-2 text-[13px] text-white/80">
          <span className="font-semibold text-[#46d369]">98% cocok</span>
          <span>{movie.year}</span>
          <span className="border border-white/35 px-1.5 py-0.5 text-[10px]">
            {movie.maturity}
          </span>
          <span>{movie.runtime}</span>
          <span className="text-amber-300">★ {movie.rating}</span>
        </div>
        <p className="mt-4 line-clamp-3 max-w-[550px] text-[14px] leading-[1.65] text-white/90 sm:text-base">
          {movie.synopsis}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-[3px] bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-white/80 sm:h-12 sm:px-7"
            onClick={() => onPlay(movie)}
            type="button"
          >
            <Play aria-hidden="true" className="h-[19px] w-[19px] fill-current" />
            Putar
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-[3px] bg-white/20 px-5 text-sm font-bold text-white transition-colors hover:bg-white/30 sm:h-12 sm:px-7"
            onClick={() => onMoreInfo(movie)}
            type="button"
          >
            <Info aria-hidden="true" className="h-[19px] w-[19px]" />
            Info selengkapnya
          </button>
        </div>
      </motion.div>
      <div className="absolute bottom-24 right-0 z-10 hidden items-center gap-3 sm:flex lg:bottom-[150px]">
        <span className="h-8 w-[3px] bg-white" />
        <span className="bg-black/25 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/30">
          {movie.maturity}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#141414] to-transparent" />
    </section>
  );
}