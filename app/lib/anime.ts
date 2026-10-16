import type { Movie, MovieServer } from "./movies";

const ANIME_API_BASE_URL =
  process.env.ANIME_API_BASE_URL || "https://www.sankavollerei.web.id";
const ANIME_API_KEY = process.env.ANIME_API_KEY || "";

const SAMEHADAKU_API_BASE_URL =
  process.env.SAMEHADAKU_API_BASE_URL || "https://www.sankavollerei.web.id";
const SAMEHADAKU_API_KEY = process.env.SAMEHADAKU_API_KEY || "";

export type AnimeEpisodeItem = {
  title: string | number;
  eps?: number | string | null;
  date?: string;
  episodeId: string;
  href?: string;
};

export type AnimeDetailData = {
  title: string;
  poster: string;
  japanese?: string;
  score?: string;
  producers?: string;
  type?: string;
  status?: string;
  episodes?: number | null;
  duration?: string;
  aired?: string;
  studios?: string;
  synopsis?: {
    paragraphs?: string[];
  };
  genreList?: {
    title: string;
    slug?: string;
  }[];
  episodeList?: AnimeEpisodeItem[];
  batch?: unknown;
};

export type AnimeEpisodeData = {
  title: string;
  animeId: string;
  releaseTime?: string;
  defaultStreamingUrl?: string;
  hasPrevEpisode?: boolean;
  prevEpisode?: { episodeId: string } | null;
  hasNextEpisode?: boolean;
  nextEpisode?: { episodeId: string } | null;
  server?: {
    qualities?: {
      title: string;
      serverList: {
        title: string;
        serverId: string;
        href: string;
      }[];
    }[];
  };
};

export function slugToAnimeId(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return 900000000 + Math.abs(hash % 90000000);
}
export async function fetchAnimeHomeList(): Promise<Movie[]> {
  try {
    const otakudesuHeaders: HeadersInit = ANIME_API_KEY ? { Authorization: `Bearer ${ANIME_API_KEY}` } : {};
    const samehadakuHeaders: HeadersInit = SAMEHADAKU_API_KEY ? { Authorization: `Bearer ${SAMEHADAKU_API_KEY}` } : {};

    const [otakudesuRes, samehadakuRes] = await Promise.allSettled([
      fetch(`${ANIME_API_BASE_URL}/anime/home`, {
        headers: otakudesuHeaders,
        next: { revalidate: 3600 },
      }),
      fetch(`${SAMEHADAKU_API_BASE_URL}/anime/samehadaku/home`, {
        headers: samehadakuHeaders,
        next: { revalidate: 3600 },
      }),
    ]);

    const seen = new Set<string>();
    const seenTitles = new Set<string>();
    const movies: Movie[] = [];

    // 1. Process Otakudesu items
    if (otakudesuRes.status === "fulfilled" && otakudesuRes.value.ok) {
      try {
        const json = await otakudesuRes.value.json();
        const data = json?.data;
        if (data) {
          const ongoingList = (data.ongoing?.animeList || []) as Array<{
            title: string;
            poster: string;
            episodes?: number;
            releaseDay?: string;
            latestReleaseDate?: string;
            animeId: string;
            score?: string;
          }>;

          const completedList = (data.completed?.animeList || []) as Array<{
            title: string;
            poster: string;
            episodes?: number;
            score?: string;
            animeId: string;
          }>;

          for (const item of [...ongoingList, ...completedList]) {
            if (!item.animeId || seen.has(item.animeId)) continue;
            seen.add(item.animeId);
            const cleanTitle = item.title.trim();
            seenTitles.add(cleanTitle.toLowerCase());

            const id = slugToAnimeId(item.animeId);
            movies.push({
              id,
              animeSlug: item.animeId,
              animeProvider: "otakudesu",
              title: cleanTitle,
              year: new Date().getFullYear(),
              maturity: "13+",
              runtime: item.episodes ? `${item.episodes} Ep` : "Serial",
              rating: item.score && !Number.isNaN(Number(item.score)) ? Number(item.score).toFixed(1) : "8.2",
              genres: ["Anime", "Animasi"],
              synopsis: `Anime ${cleanTitle} tersedia dengan subtitle Indonesia via Otakudesu.`,
              backdrop: item.poster,
              poster: item.poster,
              cast: ["Pengisi Suara Asli (Seiyuu)"],
              type: "series",
              mediaType: "tv",
              isAnime: true,
            });
          }
        }
      } catch (err) {
        console.error("Error parsing Otakudesu home:", err);
      }
    }

    // 2. Process Samehadaku items
    if (samehadakuRes.status === "fulfilled" && samehadakuRes.value.ok) {
      try {
        const json = await samehadakuRes.value.json();
        const data = json?.data;
        if (data) {
          const top10 = (data.top10?.animeList || []) as Array<{
            title: string;
            poster: string;
            score?: string;
            animeId: string;
          }>;
          const moviesList = (data.movie?.animeList || []) as Array<{
            title: string;
            poster: string;
            animeId: string;
          }>;
          const recent = (data.recent?.animeList || []) as Array<{
            title: string;
            poster: string;
            episodes?: string;
            animeId: string;
          }>;

          // Normalize recent items where animeId might be an episode id (e.g. "...-episode-2")
          const processedRecent = recent.map((item) => ({
            ...item,
            animeId: item.animeId.replace(/-episode-\d+.*$/i, ""),
          }));

          for (const item of [...top10, ...moviesList, ...processedRecent]) {
            if (!item.animeId) continue;
            const cleanTitle = item.title.trim();
            if (seenTitles.has(cleanTitle.toLowerCase())) continue;
            seenTitles.add(cleanTitle.toLowerCase());

            const slug = `samehadaku:${item.animeId}`;
            if (seen.has(slug)) continue;
            seen.add(slug);

            const id = slugToAnimeId(slug);
            const itemEpisodes = "episodes" in item && typeof item.episodes === "string" ? item.episodes.trim() : "";
            const itemScore = "score" in item && typeof item.score === "string" ? item.score.replace(/[^\d.]/g, "") : "8.0";

            movies.push({
              id,
              animeSlug: slug,
              animeProvider: "samehadaku",
              title: cleanTitle,
              year: new Date().getFullYear(),
              maturity: "13+",
              runtime: itemEpisodes ? `${itemEpisodes} Ep` : "Serial",
              rating: itemScore || "8.0",
              genres: ["Anime", "Samehadaku"],
              synopsis: `Anime ${cleanTitle} tersedia dengan subtitle Indonesia via Samehadaku.`,
              backdrop: item.poster,
              poster: item.poster,
              cast: ["Pengisi Suara Asli (Seiyuu)"],
              type: "series",
              mediaType: "tv",
              isAnime: true,
            });
          }
        }
      } catch (err) {
        console.error("Error parsing Samehadaku home:", err);
      }
    }

    return movies;
  } catch (error) {
    console.error("fetchAnimeHomeList error:", error);
    return [];
  }
}

export async function searchAnime(keyword: string): Promise<Movie[]> {
  try {
    const otakudesuHeaders: HeadersInit = ANIME_API_KEY ? { Authorization: `Bearer ${ANIME_API_KEY}` } : {};
    const res = await fetch(
      `${ANIME_API_BASE_URL}/anime/search/${encodeURIComponent(keyword)}`,
      { headers: otakudesuHeaders, next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const animeList = json?.data?.animeList || [];

    return animeList.map((item: {
      title: string;
      poster: string;
      status?: string;
      score?: string;
      animeId: string;
      genreList?: { title: string }[];
    }) => {
      const id = slugToAnimeId(item.animeId);
      return {
        id,
        animeSlug: item.animeId,
        animeProvider: "otakudesu",
        title: item.title.trim(),
        year: new Date().getFullYear(),
        maturity: "13+",
        runtime: item.status || "Anime",
        rating: item.score && !Number.isNaN(Number(item.score)) ? Number(item.score).toFixed(1) : "8.0",
        genres: item.genreList?.map((g) => g.title) || ["Anime"],
        synopsis: `Nonton anime ${item.title.trim()} subtitle Indonesia online.`,
        backdrop: item.poster,
        poster: item.poster,
        cast: ["Pengisi Suara"],
        type: "series",
        mediaType: "tv",
        isAnime: true,
      } as Movie;
    });
  } catch (error) {
    console.error("searchAnime error:", error);
    return [];
  }
}

export async function fetchAnimeDetail(slug: string): Promise<AnimeDetailData | null> {
  try {
    const isSamehadaku = slug.startsWith("samehadaku:");
    const actualSlug = isSamehadaku ? slug.replace(/^samehadaku:/, "") : slug;

    if (isSamehadaku) {
      const headers: HeadersInit = SAMEHADAKU_API_KEY ? { Authorization: `Bearer ${SAMEHADAKU_API_KEY}` } : {};
      const res = await fetch(`${SAMEHADAKU_API_BASE_URL}/anime/samehadaku/anime/${encodeURIComponent(actualSlug)}`, {
        headers,
        next: { revalidate: 1800 },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const data = json?.data;
      if (!data) return null;

      return {
        title: data.title?.trim() || "",
        poster: data.poster || "",
        japanese: data.japanese || "",
        score: typeof data.score === "object" ? data.score?.value : String(data.score || "8.0"),
        producers: data.producers || "",
        type: data.type || "TV",
        status: data.status || "",
        episodes: data.episodes || null,
        duration: data.duration || "",
        aired: data.season || "",
        studios: "",
        synopsis: data.synopsis,
        genreList: data.genreList?.map((g: { title: string; genreId?: string }) => ({
          title: g.title.trim(),
          slug: g.genreId,
        })),
        episodeList: (data.episodeList || []).map((e: { title: string | number; episodeId: string; href?: string }) => ({
          title: String(e.title),
          eps: typeof e.title === "number" ? e.title : Number(String(e.title).match(/\d+/)?.[0]) || null,
          episodeId: `samehadaku:${e.episodeId}`,
          href: e.href,
        })),
      };
    }

    const headers: HeadersInit = ANIME_API_KEY ? { Authorization: `Bearer ${ANIME_API_KEY}` } : {};
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/anime/${encodeURIComponent(actualSlug)}`, {
      headers,
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (error) {
    console.error("fetchAnimeDetail error:", error);
    return null;
  }
}

export async function fetchEpisodeStream(episodeSlug: string): Promise<AnimeEpisodeData | null> {
  try {
    const isSamehadaku = episodeSlug.startsWith("samehadaku:");
    const actualSlug = isSamehadaku ? episodeSlug.replace(/^samehadaku:/, "") : episodeSlug;

    if (isSamehadaku) {
      const headers: HeadersInit = SAMEHADAKU_API_KEY ? { Authorization: `Bearer ${SAMEHADAKU_API_KEY}` } : {};
      const res = await fetch(`${SAMEHADAKU_API_BASE_URL}/anime/samehadaku/episode/${encodeURIComponent(actualSlug)}`, {
        headers,
        next: { revalidate: 1800 },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const data = json?.data;
      if (!data) return null;

      return {
        title: data.title || "",
        animeId: `samehadaku:${data.animeId || ""}`,
        releaseTime: data.releaseTime,
        defaultStreamingUrl: data.defaultStreamingUrl,
        hasPrevEpisode: data.hasPrevEpisode,
        prevEpisode: data.prevEpisode ? { episodeId: `samehadaku:${data.prevEpisode.episodeId}` } : null,
        hasNextEpisode: data.hasNextEpisode,
        nextEpisode: data.nextEpisode ? { episodeId: `samehadaku:${data.nextEpisode.episodeId}` } : null,
        server: data.server ? {
          qualities: (data.server.qualities || []).map((q: {
            title: string;
            serverList: { title: string; serverId: string; href: string }[];
          }) => ({
            title: q.title,
            serverList: (q.serverList || []).map((s) => ({
              title: s.title,
              serverId: `samehadaku:${s.serverId}`,
              href: s.href,
            })),
          })),
        } : undefined,
      };
    }

    const headers: HeadersInit = ANIME_API_KEY ? { Authorization: `Bearer ${ANIME_API_KEY}` } : {};
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/episode/${encodeURIComponent(actualSlug)}`, {
      headers,
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (error) {
    console.error("fetchEpisodeStream error:", error);
    return null;
  }
}

export async function fetchServerStreamUrl(serverId: string): Promise<string | null> {
  try {
    const isSamehadaku = serverId.startsWith("samehadaku:");
    const actualServerId = isSamehadaku ? serverId.replace(/^samehadaku:/, "") : serverId;

    if (isSamehadaku) {
      const headers: HeadersInit = SAMEHADAKU_API_KEY ? { Authorization: `Bearer ${SAMEHADAKU_API_KEY}` } : {};
      const res = await fetch(`${SAMEHADAKU_API_BASE_URL}/anime/samehadaku/server/${encodeURIComponent(actualServerId)}`, {
        headers,
        next: { revalidate: 1800 },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.url || null;
    }

    const headers: HeadersInit = ANIME_API_KEY ? { Authorization: `Bearer ${ANIME_API_KEY}` } : {};
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/server/${encodeURIComponent(actualServerId)}`, {
      headers,
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.url || null;
  } catch (error) {
    console.error("fetchServerStreamUrl error:", error);
    return null;
  }
}
