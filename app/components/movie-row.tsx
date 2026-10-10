"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "../lib/movies";
import { MovieCard } from "./movie-card";

type MovieRowProps = {
  id?: string;
  title: string;
  movies: Movie[];
  savedIds: number[];
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  onToggleSaved: (movie: Movie) => void;
};

export function MovieRow({
  id,
  title,
  movies,
  savedIds,
  onSelect,
  onPlay,
  onToggleSaved,
}: MovieRowProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canGoLeft, setCanGoLeft] = useState(false);
  const [canGoRight, setCanGoRight] = useState(true);

  function syncArrows() {
    const rail = railRef.current;
    if (!rail) return;
    setCanGoLeft(rail.scrollLeft > 4);
    setCanGoRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  }

  function scroll(direction: -1 | 1) {
    railRef.current?.scrollBy({
      left: direction * Math.max(railRef.current.clientWidth * 0.78, 240),
      behavior: "smooth",
    });
  }

  if (movies.length === 0) return null;

  return (
    <section aria-label={title} className="group/row relative mb-9 sm:mb-11" id={id}>
      <div className="mb-3 flex items-end justify-between px-5 sm:px-8 lg:px-14">
        <h2 className="text-[17px] font-bold tracking-[-0.2px] text-white sm:text-[20px]">
          {title}
          <span className="ml-2 text-sm font-normal text-white/45 transition-colors group-hover/row:text-white/80">
            Jelajahi semua <span aria-hidden="true">›</span>
          </span>
        </h2>
      </div>
      <div className="relative">
        <div
          className="movie-rail flex gap-3 overflow-x-auto px-5 pb-4 pt-1 sm:gap-4 sm:px-8 lg:gap-[18px] lg:px-14"
          onScroll={syncArrows}
          ref={railRef}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelect}
              onPlay={onPlay}
              onToggleSaved={onToggleSaved}
              saved={savedIds.includes(movie.id)}
            />
          ))}
        </div>
        {canGoLeft && (
          <button
            aria-label={`Gulir ${title} ke kiri`}
            className="absolute bottom-4 left-0 top-1 z-20 hidden w-12 place-items-center bg-black/65 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover/row:opacity-100 lg:grid"
            onClick={() => scroll(-1)}
            type="button"
          >
            <ChevronLeft className="h-9 w-9" />
          </button>
        )}
        {canGoRight && (
          <button
            aria-label={`Gulir ${title} ke kanan`}
            className="absolute bottom-4 right-0 top-1 z-20 hidden w-12 place-items-center bg-black/65 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover/row:opacity-100 lg:grid"
            onClick={() => scroll(1)}
            type="button"
          >
            <ChevronRight className="h-9 w-9" />
          </button>
        )}
      </div>
    </section>
  );
}