import type { Movie } from "./movies";
import { getVidSrcServers, getVidSrcUrl, type TmdbMediaType } from "./vidsrc";

export type { TmdbMediaType };

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type TmdbListItem = {
  id: number;
  media_type?: TmdbMediaType | "person";
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  vote_average?: number;
  adult?: boolean;
};

export type TmdbPage = { results: TmdbListItem[] };
export type TmdbGenreList = { genres: { id: number; name: string }[] };

export function hasTmdbCredentials() {
  return Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);
}

export async function tmdbFetch<T>(path: string): Promise<T> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  if (!accessToken && process.env.TMDB_API_KEY) {
    url.searchParams.set("api_key", process.env.TMDB_API_KEY);
  }

  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TMDB returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getLicensedEmbedUrl(
  id: number,
  mediaType: TmdbMediaType,
  season = 1,
  episode = 1,
): string {
  const template = process.env.VIDEO_PROVIDER_EMBED_TEMPLATE?.trim();
  const allowedHosts = (
    process.env.VIDEO_PROVIDER_EMBED_HOSTS ||
    "vidsrc.to,vidsrc.me,vidsrc.xyz,vidsrc.cc,vidsrc.rip,vidsrc.pm,vidsrc.in,vidsrc.net"
  )
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (template) {
    try {
      const candidate = template
        .replaceAll("{id}", encodeURIComponent(String(id)))
        .replaceAll("{type}", encodeURIComponent(mediaType))
        .replaceAll("{season}", encodeURIComponent(String(season)))
        .replaceAll("{episode}", encodeURIComponent(String(episode)));
      const url = new URL(candidate);

      if (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        allowedHosts.includes(url.hostname.toLowerCase())
      ) {
        return url.toString();
      }
    } catch {
      // Fall through to default VidSrc URL
    }
  }

  return getVidSrcUrl(id, mediaType, undefined, season, episode);
}

export function mapTmdbListItem(
  item: TmdbListItem,
  mediaType: TmdbMediaType,
  genres: Map<number, string>,
): Movie {
  const date = mediaType === "movie" ? item.release_date : item.first_air_date;
  const poster = item.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}` : "/poster-placeholder.svg";
  const backdrop = item.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}/original${item.backdrop_path}`
    : poster;

  return {
    id: item.id,
    title: item.title || item.name || "Tanpa judul",
    year: date ? Number(date.slice(0, 4)) : 0,
    maturity: item.adult ? "18+" : "13+",
    runtime: mediaType === "tv" ? "Serial" : "Film",
    rating: Number(item.vote_average || 0).toFixed(1),
    genres: (item.genre_ids || []).map((id) => genres.get(id)).filter((name): name is string => Boolean(name)),
    synopsis: item.overview || "Sinopsis belum tersedia.",
    backdrop,
    poster,
    cast: [],
    type: mediaType === "tv" ? "series" : "film",
    mediaType,
    embedUrl: getLicensedEmbedUrl(item.id, mediaType),
    servers: getVidSrcServers(item.id, mediaType),
  };
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes || minutes < 1) return "Durasi tidak tersedia";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}j ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export function formatCertification(certification?: string) {
  if (!certification) return "13+";
  const normalized = certification.trim().toUpperCase();
  if (["SU", "U", "G", "PG"].includes(normalized)) return normalized;
  if (["18", "R", "NC-17", "TV-MA"].includes(normalized)) return "18+";
  if (["17", "16", "TV-14"].includes(normalized)) return "17+";
  if (["13", "12", "TV-PG"].includes(normalized)) return "13+";
  if (["7", "6", "TV-Y7"].includes(normalized)) return "7+";
  return certification;
}

export function tmdbImage(path?: string | null, size: "w500" | "original" = "w500") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : "/poster-placeholder.svg";
}