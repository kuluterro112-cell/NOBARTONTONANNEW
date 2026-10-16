import {
  fetchAnimeDetail,
  fetchEpisodeStream,
  fetchServerStreamUrl,
  slugToAnimeId,
} from "../../../lib/anime";
import type { Movie, MovieServer } from "../../../lib/movies";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const episodeQuery = url.searchParams.get("episode"); // episode number or episodeId
  const serverId = url.searchParams.get("serverId");

  // If requesting a specific server URL resolution
  if (serverId) {
    try {
      const streamUrl = await fetchServerStreamUrl(serverId);
      if (streamUrl) {
        return Response.json({ streamUrl });
      }
    } catch (e) {
      console.error("Anime server stream error:", e);
    }
    return Response.json({ error: "Server streaming URL not found" }, { status: 404 });
  }

  try {
    const detail = await fetchAnimeDetail(slug);
    if (!detail) {
      return Response.json({ error: "Anime not found" }, { status: 404 });
    }

    const id = slugToAnimeId(slug);
    const episodeList = detail.episodeList || [];
    // Sort episode list ascending (eps 1, 2, 3...)
    const sortedEpisodes = [...episodeList].sort((a, b) => {
      const numA = Number(a.eps) || 0;
      const numB = Number(b.eps) || 0;
      return numA - numB;
    });

    // Find requested episode or default to first episode
    let targetEpisode = sortedEpisodes[0];
    if (episodeQuery) {
      const byId = sortedEpisodes.find((e) => e.episodeId === episodeQuery);
      if (byId) {
        targetEpisode = byId;
      } else {
        const epNum = Number(episodeQuery);
        if (!Number.isNaN(epNum)) {
          const byNum = sortedEpisodes.find((e) => Number(e.eps) === epNum);
          if (byNum) targetEpisode = byNum;
        }
      }
    }

    let defaultStreamingUrl = "";
    const animeServers: MovieServer[] = [];

    if (targetEpisode?.episodeId) {
      try {
        const streamData = await fetchEpisodeStream(targetEpisode.episodeId);
        if (streamData) {
          defaultStreamingUrl = streamData.defaultStreamingUrl || "";

          if (streamData.server?.qualities) {
            for (const quality of streamData.server.qualities) {
              for (const s of quality.serverList || []) {
                animeServers.push({
                  id: s.serverId,
                  name: `${s.title.toUpperCase()} (${quality.title})`,
                  badge: quality.title,
                  url: s.href,
                });
              }
            }
          }
        }
      } catch (streamErr) {
        console.error("Episode stream fetch failed:", streamErr);
      }
    }

    const synopsisText =
      detail.synopsis?.paragraphs?.join("\n\n") ||
      `Nonton anime ${detail.title} subtitle Indonesia online.`;

    const movie: Movie = {
      id,
      animeSlug: slug,
      title: detail.title,
      year: detail.aired ? Number(detail.aired.match(/\d{4}/)?.[0] || 0) : new Date().getFullYear(),
      maturity: "13+",
      runtime: detail.duration || (detail.episodes ? `${detail.episodes} Ep` : "Serial"),
      rating: detail.score && !Number.isNaN(Number(detail.score)) ? Number(detail.score).toFixed(1) : "8.2",
      genres: detail.genreList?.map((g) => g.title) || ["Anime"],
      synopsis: synopsisText,
      backdrop: detail.poster,
      poster: detail.poster,
      cast: detail.studios ? [detail.studios] : ["Studio"],
      type: "series",
      mediaType: "tv",
      isAnime: true,
      animeProvider: slug.startsWith("samehadaku:") ? "samehadaku" : "otakudesu",
      embedUrl: defaultStreamingUrl || undefined,
      servers: animeServers.length > 0 ? animeServers : undefined,
      numberOfSeasons: 1,
      animeEpisodes: sortedEpisodes.map((e) => ({
        title: String(e.title),
        eps: e.eps,
        episodeId: e.episodeId,
      })),
    };

    return Response.json(movie);
  } catch (error) {
    console.error("Anime detail route error:", error);
    return Response.json({ error: "Failed to load anime details" }, { status: 500 });
  }
}
