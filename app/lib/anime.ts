import type { Movie, MovieServer } from "./movies";

const ANIME_API_BASE_URL =
  process.env.ANIME_API_BASE_URL || "https://www.sankavollerei.web.id";

export type AnimeEpisodeItem = {
  title: string;
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
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/home`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data;
    if (!data) return [];

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

    const all = [...ongoingList, ...completedList];
    const seen = new Set<string>();
    const movies: Movie[] = [];

    for (const item of all) {
      if (!item.animeId || seen.has(item.animeId)) continue;
      seen.add(item.animeId);

      const id = slugToAnimeId(item.animeId);
      movies.push({
        id,
        animeSlug: item.animeId,
        title: item.title,
        year: new Date().getFullYear(),
        maturity: "13+",
        runtime: item.episodes ? `${item.episodes} Ep` : "Serial",
        rating: item.score && !Number.isNaN(Number(item.score)) ? Number(item.score).toFixed(1) : "8.2",
        genres: ["Anime", "Animasi"],
        synopsis: `Anime ${item.title} tersedia dengan subtitle Indonesia.`,
        backdrop: item.poster,
        poster: item.poster,
        cast: ["Pengisi Suara Asli (Seiyuu)"],
        type: "series",
        mediaType: "tv",
        isAnime: true,
      });
    }

    return movies;
  } catch (error) {
    console.error("fetchAnimeHomeList error:", error);
    return [];
  }
}

export async function searchAnime(keyword: string): Promise<Movie[]> {
  try {
    const res = await fetch(
      `${ANIME_API_BASE_URL}/anime/search/${encodeURIComponent(keyword)}`,
      { next: { revalidate: 600 } },
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
        title: item.title,
        year: new Date().getFullYear(),
        maturity: "13+",
        runtime: item.status || "Anime",
        rating: item.score && !Number.isNaN(Number(item.score)) ? Number(item.score).toFixed(1) : "8.0",
        genres: item.genreList?.map((g) => g.title) || ["Anime"],
        synopsis: `Nonton anime ${item.title} subtitle Indonesia online.`,
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
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/anime/${encodeURIComponent(slug)}`, {
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
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/episode/${encodeURIComponent(episodeSlug)}`, {
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
    const res = await fetch(`${ANIME_API_BASE_URL}/anime/server/${encodeURIComponent(serverId)}`, {
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
