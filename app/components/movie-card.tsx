"use client";

import Image from "next/image";
import { Check, CirclePlus, Play, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "../lib/movies";

type MovieCardProps = {
  movie: Movie;
  saved: boolean;
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  onToggleSaved: (movie: Movie) => void;
  layout?: "rail" | "grid";
};

export function MovieCard({ movie, saved, onSelect, onPlay, onToggleSaved, layout = "rail" }: MovieCardProps) {
  return (
    <motion.article
      className={
        layout === "grid"
          ? "group relative w-full cursor-pointer"
          : "group relative w-[148px] shrink-0 cursor-pointer sm:w-[190px] lg:w-[210px]"
      }
      layout
      onClick={() => onSelect(movie)}
      whileHover={{ scale: 1.08, zIndex: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[3px] bg-[#242424] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <Image
          alt={`Poster ${movie.title}`}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          fill
          unoptimized
          sizes="(max-width: 640px) 148px, (max-width: 1024px) 190px, 210px"
          src={movie.poster}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/10 opacity-80 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="mb-2 flex items-center gap-2">
            <button
              aria-label={`Putar ${movie.title}`}
              className="grid h-8 w-8 place-items-center rounded-full bg-white text-black hover:bg-white/80"
              onClick={(event) => {
                event.stopPropagation();
                onPlay(movie);
              }}
              type="button"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
            <button
              aria-label={saved ? `Hapus ${movie.title} dari daftar` : `Tambah ${movie.title} ke daftar`}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/60 bg-black/45 text-white hover:border-white"
              onClick={(event) => {
                event.stopPropagation();
                onToggleSaved(movie);
              }}
              type="button"
            >
              {saved ? <Check className="h-4 w-4" /> : <CirclePlus className="h-4 w-4" />}
            </button>
          </div>
          <p className="line-clamp-1 text-[13px] font-semibold text-white">{movie.title}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/80">
            <span className="flex items-center gap-1 text-amber-300">
              <Star className="h-3 w-3 fill-current" /> {movie.rating}
            </span>
            <span className="border border-white/35 px-1">{movie.maturity}</span>
            <span>{movie.runtime}</span>
          </div>
          <p className="mt-1.5 line-clamp-1 text-[10px] text-white/65">
            {movie.genres.join(" · ")}
          </p>
        </div>
        <span className="absolute left-2.5 top-2.5 rounded-sm bg-[#e50914] px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white shadow">
          Nobar
        </span>
      </div>
      <h3 className="mt-2 line-clamp-1 text-[12px] font-medium text-white/85 group-hover:text-white sm:text-[13px]">
        {movie.title}
      </h3>
    </motion.article>
  );
}