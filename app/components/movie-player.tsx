"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Clapperboard,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Server,
  Tv,
  X,
} from "lucide-react";
import type { Movie } from "../lib/movies";
import { getVidSrcServers, getVidSrcUrl, type TmdbMediaType } from "../lib/vidsrc";

type MoviePlayerProps = {
  movie: Movie | null;
  onClose: () => void;
};

type DetailsLookup = {
  key: string;
  embedUrl?: string;
  previewUrl?: string;
  numberOfSeasons?: number;
};

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function MoviePlayer({ movie, onClose }: MoviePlayerProps) {
  const [detailsLookup, setDetailsLookup] = useState<DetailsLookup | null>(null);
  const [activeServerId, setActiveServerId] = useState<string>("vidsrc.to");
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false);
  const [landscapeMessage, setLandscapeMessage] = useState<string>("");
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const mediaType: TmdbMediaType =
    movie?.mediaType || (movie?.type === "series" ? "tv" : "movie");
  const isSeries = mediaType === "tv";

  const lookupKey = movie ? `${mediaType}:${movie.id}` : "";

  // Reset season/episode and server when movie changes
  useEffect(() => {
    if (movie) {
      setSeason(1);
      setEpisode(1);
      setActiveServerId("vidsrc.to");
      setReloadKey(0);
    }
  }, [movie?.id]);

  // Fetch additional details if needed (trailers, seasons count, etc.)
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;
    const key = `${mediaType}:${movie.id}`;

    fetch(`/api/movies/${movie.id}?type=${mediaType}&season=${season}&episode=${episode}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Movie;
      })
      .then((details) => {
        if (!cancelled && details) {
          setDetailsLookup({
            key,
            embedUrl: details.embedUrl,
            previewUrl: details.previewUrl,
            numberOfSeasons: details.numberOfSeasons,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setDetailsLookup({ key });
      });

    return () => {
      cancelled = true;
    };
  }, [movie?.id, mediaType, season, episode]);

  // Handle escape key
  useEffect(() => {
    if (!movie) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [movie, onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const player = playerContainerRef.current;
      const fullscreenElement = document.fullscreenElement;
      const playerIsFullscreen = Boolean(player && fullscreenElement && player.contains(fullscreenElement));

      setIsLandscapeMode(playerIsFullscreen);
      if (!playerIsFullscreen) {
        setLandscapeMessage("");
        screen.orientation?.unlock?.();
        return;
      }

      if (!player || !fullscreenElement) return;
      const orientation = screen.orientation as ScreenOrientationWithLock;
      if (!orientation.lock) {
        setLandscapeMessage("Browser tidak menyediakan kunci orientasi; player diputar sebagai fallback.");
        return;
      }

      void orientation.lock("landscape").then(
        () => {
          if (player.contains(document.fullscreenElement)) setLandscapeMessage("");
        },
        () => {
          if (player.contains(document.fullscreenElement)) {
            setLandscapeMessage("Browser membatasi rotasi otomatis; player diputar sebagai fallback.");
          }
        },
      );
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const totalSeasons = Math.max(
    1,
    movie?.numberOfSeasons ||
      (detailsLookup?.key === lookupKey ? detailsLookup.numberOfSeasons : undefined) ||
      (isSeries ? 5 : 1),
  );

  // VidSrc servers list for current season/episode
  const availableServers = useMemo(() => {
    if (!movie || movie.playbackUrl) return [];
    return getVidSrcServers(movie.id, mediaType, season, episode);
  }, [movie, mediaType, season, episode]);

  // Resolved stream URL
  const activeStreamUrl = useMemo(() => {
    if (!movie) return undefined;
    if (movie.playbackUrl) return undefined;

    if (activeServerId === "trailer") {
      return (
        movie.previewUrl ||
        (detailsLookup?.key === lookupKey ? detailsLookup.previewUrl : undefined)
      );
    }

    return getVidSrcUrl(movie.id, mediaType, activeServerId, season, episode);
  }, [movie, mediaType, activeServerId, season, episode, detailsLookup, lookupKey]);

  const toggleLandscapeMode = async () => {
    const player = playerContainerRef.current;
    if (!player) return;

    if (isLandscapeMode) {
      try {
        if (document.fullscreenElement && player.contains(document.fullscreenElement)) {
          await document.exitFullscreen();
        }
        screen.orientation?.unlock?.();
        setIsLandscapeMode(false);
        setLandscapeMessage("");
      } catch {
        setLandscapeMessage("Belum dapat keluar dari layar penuh. Coba tombol kembali perangkat.");
      }
      return;
    }

    setIsLandscapeMode(true);
    setLandscapeMessage("");

    try {
      if (player.requestFullscreen) {
        await player.requestFullscreen();
      } else {
        setLandscapeMessage("Browser tidak menyediakan kunci orientasi; player diputar sebagai fallback.");
      }
    } catch {
      setLandscapeMessage("Browser membatasi rotasi otomatis; player diputar sebagai fallback.");
    }
  };

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black text-white"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          {/* Top Bar / Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#101010]/90 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Kembali ke katalog"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                onClick={onClose}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold sm:text-base">{movie.title}</h2>
                  <span className="shrink-0 rounded bg-[#e50914] px-1.5 py-0.2 text-[10px] font-bold uppercase text-white">
                    VidSrc
                  </span>
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <span>{movie.year || ""}</span>
                  <span>•</span>
                  <span>{isSeries ? "Serial TV" : "Film"}</span>
                  {isSeries && (
                    <>
                      <span>•</span>
                      <span className="text-white/80">S{season} : E{episode}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeStreamUrl && (
                <>
                  <button
                    aria-label="Refresh player"
                    className="hidden h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 sm:inline-flex"
                    onClick={handleReload}
                    title="Muat ulang streaming"
                    type="button"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                  <a
                    aria-label="Buka di tab baru"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20"
                    href={activeStreamUrl}
                    rel="noreferrer"
                    target="_blank"
                    title="Buka player di tab baru"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </>
              )}
              <button
                aria-label="Tutup player"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Subheader: Server & Episode Controls */}
          {!movie.playbackUrl && (
            <div className="mx-auto flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
              {/* Server selector */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="mr-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-white/45">
                  <Server className="h-3.5 w-3.5 text-[#e50914]" />
                  Server:
                </span>
                {availableServers.map((srv, index) => {
                  const isActive = activeServerId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#e50914] text-white shadow"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                      onClick={() => {
                        setActiveServerId(srv.id);
                        setReloadKey((prev) => prev + 1);
                      }}
                      type="button"
                    >
                      <span>{srv.id.replace("vidsrc.", "").toUpperCase()}</span>
                      <span className="text-[10px] opacity-75">#{index + 1}</span>
                    </button>
                  );
                })}
                {(movie.previewUrl || detailsLookup?.previewUrl) && (
                  <button
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      activeServerId === "trailer"
                        ? "bg-amber-600 text-white shadow"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                    onClick={() => setActiveServerId("trailer")}
                    type="button"
                  >
                    Trailer
                  </button>
                )}
              </div>

              {/* Series Season & Episode selectors */}
              {isSeries && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-white/50">
                    <Tv className="h-3.5 w-3.5" />
                    <span>Musim:</span>
                  </div>
                  <select
                    aria-label="Pilih Season"
                    className="rounded border border-white/20 bg-zinc-800 px-2 py-1 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    onChange={(e) => {
                      setSeason(Number(e.target.value));
                      setEpisode(1);
                      setReloadKey((prev) => prev + 1);
                    }}
                    value={season}
                  >
                    {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Season {s}
                      </option>
                    ))}
                  </select>

                  <div className="ml-1 text-white/50">Ep:</div>
                  <select
                    aria-label="Pilih Episode"
                    className="rounded border border-white/20 bg-zinc-800 px-2 py-1 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    onChange={(e) => {
                      setEpisode(Number(e.target.value));
                      setReloadKey((prev) => prev + 1);
                    }}
                    value={episode}
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((ep) => (
                      <option key={ep} value={ep}>
                        Ep {ep}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Main Video Frame */}
          <main className="mx-auto w-full max-w-[1000px] px-4 pb-5 pt-2 sm:px-6 sm:pt-4">
            <div
              ref={playerContainerRef}
              className={`relative mx-auto aspect-video w-full max-w-[720px] overflow-hidden rounded-xl bg-black shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/15 ${
                isLandscapeMode ? "player-landscape-mode" : ""
              }`}
            >
              {isLandscapeMode && (
                <button
                  aria-label="Keluar mode lanskap"
                  className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white shadow-lg"
                  onClick={() => void toggleLandscapeMode()}
                  title="Keluar mode lanskap"
                  type="button"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
              )}
              {movie.playbackUrl ? (
                <video
                  autoPlay
                  className="h-full w-full object-contain"
                  controls
                  playsInline
                  src={movie.playbackUrl}
                />
              ) : activeStreamUrl ? (
                <iframe
                  key={`${activeStreamUrl}-${reloadKey}`}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                  referrerPolicy="origin"
                  src={activeStreamUrl}
                  title={`Streaming ${movie.title}`}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <Clapperboard className="mb-5 h-12 w-12 text-white/35" />
                  <h3 className="text-lg font-semibold sm:text-2xl">
                    Menyiapkan player streaming...
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
                    Memuat tautan video dari API VidSrc...
                  </p>
                </div>
              )}
            </div>

            <section
              aria-labelledby="player-movie-title"
              className="mx-auto mt-6 max-w-[820px] rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-xl sm:mt-7 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f0444d]">
                    {isSeries ? "Serial pilihan" : "Mulai menonton"}
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" id="player-movie-title">
                    {movie.title}
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/55">
                    {movie.year > 0 && <span>{movie.year}</span>}
                    {movie.year > 0 && <span aria-hidden="true">·</span>}
                    <span>{isSeries ? `Season ${season}, Episode ${episode}` : movie.runtime}</span>
                    <span aria-hidden="true">·</span>
                    <span>{movie.maturity}</span>
                  </p>
                </div>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-sm font-semibold text-amber-200">
                  ★ {movie.rating}
                </span>
              </div>

              {movie.genres.length > 0 && (
                <div aria-label="Genre" className="mt-5 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/65"
                      key={genre}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-white/10 pt-5">
                <h2 className="text-sm font-semibold text-white">Sinopsis</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">
                  {movie.synopsis || "Sinopsis belum tersedia."}
                </p>
              </div>

              {movie.cast.length > 0 && (
                <p className="mt-4 text-xs leading-6 text-white/45">
                  <span className="font-semibold text-white/65">Pemeran: </span>
                  {movie.cast.join(", ")}
                </p>
              )}
            </section>
          </main>

          <footer className="mx-auto flex w-full max-w-[1000px] items-center justify-between gap-4 border-t border-white/10 px-4 py-4 text-xs text-white/45 sm:px-6">
            <div className="flex items-center gap-2 truncate">
              <span className="hidden sm:inline">
                Jika video lambat, coba ganti server di atas.
              </span>
              {landscapeMessage && (
                <span aria-live="polite" className="text-amber-200/80">
                  {landscapeMessage}
                </span>
              )}
            </div>
            <button
              aria-label={isLandscapeMode ? "Keluar mode lanskap" : "Mode lanskap"}
              className="ml-4 flex shrink-0 items-center gap-1 text-white/70 hover:text-white"
              onClick={() => void toggleLandscapeMode()}
              title={isLandscapeMode ? "Keluar mode lanskap" : "Putar video ke lanskap"}
              type="button"
            >
              {isLandscapeMode ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Keluar Lanskap</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Lanskap</span>
                </>
              )}
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}