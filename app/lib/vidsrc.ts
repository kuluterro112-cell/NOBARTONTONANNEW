import type { MovieServer } from "./movies";

export type TmdbMediaType = "movie" | "tv";

export interface VidSrcServerConfig {
  id: string;
  name: string;
  badge?: string;
  buildUrl: (id: number, mediaType: TmdbMediaType, season?: number, episode?: number) => string;
}

export const VIDSRC_SERVERS: VidSrcServerConfig[] = [
  {
    id: "vidsrc.to",
    name: "VidSrc To (Utama)",
    badge: "Cepat & Stabil",
    buildUrl: (id, mediaType, season = 1, episode = 1) =>
      mediaType === "tv"
        ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    id: "vidsrc.me",
    name: "VidSrc Me",
    badge: "Server 2",
    buildUrl: (id, mediaType, season = 1, episode = 1) =>
      mediaType === "tv"
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${id}`,
  },
  {
    id: "vidsrc.xyz",
    name: "VidSrc XYZ",
    badge: "Server 3",
    buildUrl: (id, mediaType, season = 1, episode = 1) =>
      mediaType === "tv"
        ? `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.xyz/embed/movie/${id}`,
  },
  {
    id: "vidsrc.cc",
    name: "VidSrc CC",
    badge: "Server 4",
    buildUrl: (id, mediaType, season = 1, episode = 1) =>
      mediaType === "tv"
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
  {
    id: "vidsrc.rip",
    name: "VidSrc Rip",
    badge: "Server 5",
    buildUrl: (id, mediaType, season = 1, episode = 1) =>
      mediaType === "tv"
        ? `https://vidsrc.rip/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.rip/embed/movie/${id}`,
  },
  {
    id: "vidsrc.pm",
    name: "VidSrc PM",
    badge: "Cadangan",
    buildUrl: (id, mediaType, season = 1, episode = 1) =>
      mediaType === "tv"
        ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.pm/embed/movie/${id}`,
  },
];

export function getVidSrcUrl(
  id: number,
  mediaType: TmdbMediaType = "movie",
  serverId?: string,
  season = 1,
  episode = 1,
): string {
  const chosen = VIDSRC_SERVERS.find((s) => s.id === serverId) || VIDSRC_SERVERS[0];
  return chosen.buildUrl(id, mediaType, season, episode);
}

export function getVidSrcServers(
  id: number,
  mediaType: TmdbMediaType = "movie",
  season = 1,
  episode = 1,
): MovieServer[] {
  return VIDSRC_SERVERS.map((server) => ({
    id: server.id,
    name: server.name,
    badge: server.badge,
    url: server.buildUrl(id, mediaType, season, episode),
  }));
}
