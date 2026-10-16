"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CirclePlus, Play, Star, X } from "lucide-react";
import type { Movie } from "../lib/movies";

type MovieModalProps = {
  movie: Movie | null;
  saved: boolean;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onToggleSaved: (movie: Movie) => void;
};

export function MovieModal({ movie, saved, onClose, onPlay, onToggleSaved }: MovieModalProps) {
  const [details, setDetails] = useState<Movie | null>(null);

  useEffect(() => {
    if (!movie) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [movie, onClose]);

  useEffect(() => {
    let cancelled = false;
    if (!movie?.mediaType) return;

    fetch(`/api/movies/${movie.id}?type=${movie.mediaType}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Movie;
      })
      .then((data) => {
        if (!cancelled && data) setDetails(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [movie?.id, movie?.mediaType]);

  const displayMovie = movie && details?.id === movie.id ? { ...movie, ...details } : movie;

  return (
    <AnimatePresence>
      {displayMovie && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-8 backdrop-blur-sm sm:px-6 sm:py-12"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.article
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label={`Detail ${displayMovie.title}`}
            aria-modal="true"
            className="relative my-auto w-full max-w-[850px] overflow-hidden rounded-md bg-[#181818] shadow-[0_24px_90px_rgba(0,0,0,0.7)]"
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            role="dialog"
            transition={{ duration: 0.22 }}
          >
            <div className="relative h-[240px] sm:h-[390px]">
              <Image
                alt={`Latar ${displayMovie.title}`}
                className="object-cover object-center"
                fill
                unoptimized
                sizes="(max-width: 900px) 100vw, 850px"
                src={displayMovie.backdrop}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/10 to-black/15" />
              <button
                aria-label="Tutup detail"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#181818] text-white transition-colors hover:bg-[#333] sm:right-5 sm:top-5"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-9">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e50914]">
                  Pilihan Nobar
                </p>
                <h2 className="max-w-[680px] text-[32px] font-black leading-[1.05] text-white sm:text-[50px]">
                  {displayMovie.title}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-[3px] bg-white px-5 text-sm font-bold text-black hover:bg-white/80"
                    onClick={() => onPlay(displayMovie)}
                    type="button"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Putar
                  </button>
                  <button
                    aria-label={saved ? "Hapus dari daftar saya" : "Tambahkan ke daftar saya"}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/50 text-white hover:border-white"
                    onClick={() => onToggleSaved(displayMovie)}
                    type="button"
                  >
                    {saved ? <Check className="h-5 w-5" /> : <CirclePlus className="h-5 w-5" />}
                  </button>
                  {displayMovie.isAnime && (
                    <span className="text-xs text-white/55">
                      Subtitle Indonesia via {displayMovie.animeProvider === "samehadaku" ? "Samehadaku" : "Otakudesu"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-8 px-5 pb-8 pt-2 sm:grid-cols-[1.5fr_1fr] sm:px-9 sm:pb-10">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px] text-white/70">
                  <span className="font-semibold text-[#46d369]">98% cocok</span>
                  <span>{displayMovie.year || "Tahun tidak tersedia"}</span>
                  <span className="border border-white/35 px-1.5 py-0.5 text-[10px]">
                    {displayMovie.maturity}
                  </span>
                  <span>{displayMovie.runtime}</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="h-3 w-3 fill-current" /> {displayMovie.rating}
                  </span>
                </div>
                <p className="text-[14px] leading-6 text-white/90">{displayMovie.synopsis}</p>
              </div>
              <div className="space-y-4 text-[12px] leading-5">
                <p>
                  <span className="text-white/45">Pemeran: </span>
                  <span className="text-white/85">{displayMovie.cast.join(", ") || "Belum tersedia"}</span>
                </p>
                <p>
                  <span className="text-white/45">Genre: </span>
                  <span className="text-white/85">{displayMovie.genres.join(", ") || "Belum tersedia"}</span>
                </p>
                {displayMovie.license ? (
                  <p>
                    <span className="text-white/45">Lisensi: </span>
                    {displayMovie.licenseUrl ? (
                      <a className="text-white/85 underline underline-offset-2" href={displayMovie.licenseUrl} rel="noreferrer" target="_blank">
                        {displayMovie.license}
                      </a>
                    ) : (
                      <span className="text-white/85">{displayMovie.license}</span>
                    )}
                  </p>
                ) : (
                  <p>
                    <span className="text-white/45">Tonton resmi: </span>
                    {displayMovie.watchProviders && displayMovie.watchProviders.length > 0 ? (
                      <span className="text-white/85">{displayMovie.watchProviders.join(", ")}</span>
                    ) : (
                      <span className="text-white/85">Info penyedia belum tersedia untuk Indonesia.</span>
                    )}
                  </p>
                )}
                {displayMovie.attribution && (
                  <p className="text-white/55">{displayMovie.attribution}</p>
                )}
                {displayMovie.watchUrl && (
                  <a
                    className="inline-flex text-[#e50914] underline underline-offset-4 hover:text-red-300"
                    href={displayMovie.watchUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Lihat opsi streaming resmi
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}