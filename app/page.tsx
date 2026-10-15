"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";
import { AdSenseUnit } from "./components/adsense-unit";
import { Hero } from "./components/hero";
import { MovieModal } from "./components/movie-modal";
import { MoviePlayer } from "./components/movie-player";
import { MovieRow } from "./components/movie-row";
import { Navbar } from "./components/navbar";
import { freeMovies } from "./lib/free-movies";
import { movies, trendingMovies, type Movie, type MovieSections } from "./lib/movies";

const fallbackSections: MovieSections = {
  trending: trendingMovies.map((movie) => movie.id),
  topRated: movies.filter((movie) => movie.type !== "series" && Number(movie.rating) >= 8).map((movie) => movie.id),
  series: movies.filter((movie) => movie.type === "series").map((movie) => movie.id),
  anime: movies.filter((movie) => movie.isAnime).map((movie) => movie.id),
  action: movies
    .filter((movie) => movie.genres.some((genre) => ["Aksi", "Petualangan"].includes(genre)))
    .map((movie) => movie.id),
  comedy: movies
    .filter((movie) => movie.genres.some((genre) => ["Komedi", "Romansa"].includes(genre)))
    .map((movie) => movie.id),
};

type CatalogueResponse = { movies: Movie[]; sections: MovieSections };

export default function Home() {
  const [heroMovie, setHeroMovie] = useState<Movie>(trendingMovies[0]);
  const [catalogue, setCatalogue] = useState<Movie[]>(movies);
  const [sections, setSections] = useState<MovieSections>(fallbackSections);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [savedListReady, setSavedListReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroMovie(trendingMovies[Math.floor(Math.random() * trendingMovies.length)]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/movies")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as CatalogueResponse;
      })
      .then((data) => {
        if (cancelled || !data?.movies.length) return;
        setCatalogue(data.movies);
        setSections(data.sections);
        const featured = data.movies.filter(
          (movie) => data.sections.trending.includes(movie.id) || data.sections.anime.includes(movie.id),
        );
        if (featured.length > 0) {
          setHeroMovie(featured[Math.floor(Math.random() * featured.length)]);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

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

  const allMovies = [...catalogue, ...freeMovies];

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

  function byIds(ids: number[]) {
    return allMovies.filter((movie) => ids.includes(movie.id));
  }

  const actionMovies = byIds(sections.action);
  const comfortMovies = byIds(sections.comedy);
  const savedMovies = allMovies.filter((movie) => savedIds.includes(movie.id));

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-hidden bg-[#141414] text-white">
        <Hero movie={heroMovie} onMoreInfo={setSelectedMovie} onPlay={openPlayer} />

        <div className="relative z-10 -mt-5 pb-12 sm:-mt-8">
          <>
              <MovieRow
                id="anime"
                movies={byIds(sections.anime)}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Anime populer"
              />
              <MovieRow
                id="trending"
                movies={byIds(sections.trending)}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Trending sekarang"
              />
              <div className="px-5 sm:px-8 lg:px-14">
                <AdSenseUnit />
              </div>
              <MovieRow
                id="movies"
                movies={byIds(sections.topRated)}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Pilihan dengan rating tertinggi"
              />
              <MovieRow
                id="tv-shows"
                movies={byIds(sections.series)}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Serial pilihan"
              />
              <MovieRow
                movies={actionMovies}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Aksi & petualangan"
              />
              <MovieRow
                movies={comfortMovies}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Cerita untuk dinikmati"
              />
              <MovieRow
                movies={freeMovies}
                onSelect={setSelectedMovie}
                onPlay={openPlayer}
                onToggleSaved={toggleSaved}
                savedIds={savedIds}
                title="Gratis & legal"
              />

              <section aria-label="Daftar saya" className="mb-10" id="my-list">
                {savedMovies.length > 0 ? (
                  <MovieRow
                    movies={savedMovies}
                    onSelect={setSelectedMovie}
                    onPlay={openPlayer}
                    onToggleSaved={toggleSaved}
                    savedIds={savedIds}
                    title="Daftar saya"
                  />
                ) : (
                  <div className="mx-5 border-t border-white/10 pt-6 sm:mx-8 lg:mx-14">
                    <h2 className="text-[17px] font-bold sm:text-[20px]">Daftar saya</h2>
                    <p className="mt-2 text-sm text-white/50">
                      Simpan film dan serial untuk ditonton nanti.
                    </p>
                  </div>
                )}
              </section>
          </>
        </div>

        <footer className="mx-auto flex max-w-[1600px] items-center gap-2 px-5 pb-8 text-xs text-white/35 sm:px-8 lg:px-14">
          <Clapperboard className="h-4 w-4 text-[#e50914]" />
          <span>Nobar Tontonan</span>
          <span className="mx-1">·</span>
          <span>Temukan cerita berikutnya.</span>
          <span className="mx-1">·</span>
          <span>
            This product uses the <a className="underline underline-offset-2" href="https://www.themoviedb.org/" rel="noreferrer" target="_blank">TMDB API</a> but is not endorsed or certified by TMDB.
          </span>
        </footer>
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