"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Film, LoaderCircle, Search } from "lucide-react";
import { AdSenseUnit } from "../components/adsense-unit";
import { MovieCard } from "../components/movie-card";
import { MovieModal } from "../components/movie-modal";
import { MoviePlayer } from "../components/movie-player";
import { Navbar } from "../components/navbar";
import { freeMovies } from "../lib/free-movies";
import { movies, type Movie, type MovieSections } from "../lib/movies";

type CatalogueResponse = { movies: Movie[]; sections?: MovieSections };

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isCloseWord(query: string, candidate: string) {
  if (query === candidate || candidate.startsWith(query) || query.startsWith(candidate)) return true;
  if (Math.abs(query.length - candidate.length) > 1 || query.length < 4) return false;

  let differences = 0;
  let queryIndex = 0;
  let candidateIndex = 0;
  while (queryIndex < query.length && candidateIndex < candidate.length) {
    if (query[queryIndex] === candidate[candidateIndex]) {
      queryIndex += 1;
      candidateIndex += 1;
      continue;
    }
    differences += 1;
    if (differences > 1) return false;
    if (query.length > candidate.length) queryIndex += 1;
    else if (candidate.length > query.length) candidateIndex += 1;
    else {
      queryIndex += 1;
      candidateIndex += 1;
    }
  }

  return differences + (query.length - queryIndex) + (candidate.length - candidateIndex) <= 1;
}

function getTitleMatchScore(title: string, query: string) {
  const normalizedTitle = normalize(title);
  if (!normalizedTitle) return 0;

  const compactTitle = normalizedTitle.replaceAll(" ", "");
  const compactQuery = query.replaceAll(" ", "");
  if (compactTitle === compactQuery) return 100;
  if (compactTitle.includes(compactQuery)) return 90;
  if (compactQuery.includes(compactTitle)) return 80;

  const titleWords = normalizedTitle.split(" ");
  const queryWords = query.split(" ");
  const matchedWords = queryWords.filter((queryWord) =>
    titleWords.some((titleWord) => isCloseWord(queryWord, titleWord)),
  ).length;

  return matchedWords === queryWords.length ? 65 + matchedWords : 0;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const originalQuery = searchParams.get("q")?.trim() || "";
  const [catalogue, setCatalogue] = useState<Movie[]>(movies);
  const [catalogueError, setCatalogueError] = useState(false);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [savedListReady, setSavedListReady] = useState(false);
  const query = normalize(originalQuery);

  useEffect(() => {
    let cancelled = false;

    const minimumLoadingTime = query
      ? new Promise<void>((resolve) => {
          window.setTimeout(resolve, 4000);
        })
      : Promise.resolve();
    const catalogueRequest = fetch(
      query ? `/api/movies?q=${encodeURIComponent(originalQuery)}` : "/api/movies",
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("The latest catalogue could not be loaded.");
        return (await response.json()) as CatalogueResponse;
      })
      .then((data) => {
        if (!cancelled) {
          setCatalogue(query ? [...data.movies, ...movies] : data.movies.length ? data.movies : movies);
          setCatalogueError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogueError(true);
      });

    Promise.all([catalogueRequest, minimumLoadingTime])
      .finally(() => {
        if (!cancelled) setLoadedQuery(originalQuery);
      });

    return () => {
      cancelled = true;
    };
  }, [originalQuery, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("nobar-my-list");
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.every((id) => typeof id === "number")) {
            setSavedIds(parsed);
          }
        }
      } catch {
        window.localStorage.removeItem("nobar-my-list");
      } finally {
        setSavedListReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (savedListReady) {
      window.localStorage.setItem("nobar-my-list", JSON.stringify(savedIds));
    }
  }, [savedIds, savedListReady]);

  const results = useMemo(() => {
    if (!query) return [];
    const uniqueMovies = new Map<string, Movie>();
    for (const movie of [...catalogue, ...freeMovies]) {
      uniqueMovies.set(`${movie.mediaType || movie.type || "movie"}:${movie.id}`, movie);
    }
    return [...uniqueMovies.values()]
      .map((movie) => ({ movie, score: getTitleMatchScore(movie.title, query) }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score || Number(right.movie.rating) - Number(left.movie.rating))
      .map(({ movie }) => movie);
  }, [catalogue, query]);

  function toggleSaved(movie: Movie) {
    setSavedIds((current) =>
      current.includes(movie.id)
        ? current.filter((id) => id !== movie.id)
        : [...current, movie.id],
    );
  }

  function openPlayer(movie: Movie) {
    setSelectedMovie(null);
    setPlayerMovie(movie);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#141414] pb-16 pt-[100px] text-white">
        <section className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e50914]">
                <Search className="h-4 w-4" /> Hasil pencarian
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {originalQuery ? <>Hasil untuk “{originalQuery}”</> : "Cari tontonan"}
              </h1>
              {query && (
                <p className="mt-2 text-sm text-white/55">
                  {results.length} judul yang sama atau mirip
                </p>
              )}
            </div>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-white/20 px-4 text-sm font-semibold text-white/80 transition-colors hover:border-white/50 hover:bg-white/10 hover:text-white"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Kembali ke beranda
            </Link>
          </div>

          {catalogueError && (
            <p className="mb-6 text-sm text-amber-200/80" role="status">
              Katalog terbaru belum dapat dimuat. Hasil di bawah menggunakan katalog yang tersedia di aplikasi.
            </p>
          )}

          {!query ? (
            <div className="flex min-h-52 flex-col items-center justify-center text-center text-white/55">
              <Search className="mb-3 h-8 w-8" />
              <p className="text-lg font-semibold text-white">Masukkan judul tontonan</p>
              <p className="mt-1 text-sm">Ketik judul di kolom pencarian lalu tekan Enter.</p>
            </div>
          ) : loadedQuery !== originalQuery ? (
            <div
              aria-live="polite"
              className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm text-white/55"
              role="status"
            >
              <LoaderCircle className="h-8 w-8 animate-spin text-[#e50914]" />
              Memuat semua hasil pencarian...
            </div>
          ) : results.length > 0 ? (
            <div className="grid max-w-[1000px] grid-cols-3 items-start gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8">
              {results.map((movie, index) => (
                <Fragment key={`${movie.mediaType || movie.type || "movie"}:${movie.id}`}>
                  <MovieCard
                    layout="grid"
                    movie={movie}
                    onSelect={setSelectedMovie}
                    onPlay={openPlayer}
                    onToggleSaved={toggleSaved}
                    saved={savedIds.includes(movie.id)}
                  />
                  {index === 5 && results.length > 6 && (
                    <div className="col-span-3">
                      <AdSenseUnit />
                    </div>
                  )}
                </Fragment>
              ))}
              {results.length <= 6 && (
                <div className="col-span-3">
                  <AdSenseUnit />
                </div>
              )}
            </div>
          ) : loadedQuery === originalQuery ? (
            <div className="flex min-h-52 flex-col items-center justify-center text-center text-white/55">
              <Film className="mb-3 h-8 w-8" />
              <p className="text-lg font-semibold text-white">Belum ada judul yang cocok</p>
              <p className="mt-1 text-sm">Coba ejaan atau kata kunci judul lainnya.</p>
            </div>
          ) : (
            <div aria-live="polite" className="flex min-h-52 items-center justify-center text-sm text-white/55">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-[#e50914]" />
              Memuat katalog dan mencari judul...
            </div>
          )}
        </section>
      </main>

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={openPlayer}
        onToggleSaved={toggleSaved}
        saved={selectedMovie ? savedIds.includes(selectedMovie.id) : false}
      />
      <MoviePlayer
        key={playerMovie ? `${playerMovie.mediaType || playerMovie.type || "movie"}:${playerMovie.id}` : "closed"}
        movie={playerMovie}
        onClose={() => setPlayerMovie(null)}
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#141414] text-sm text-white/60">
          Memuat hasil pencarian...
        </main>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
