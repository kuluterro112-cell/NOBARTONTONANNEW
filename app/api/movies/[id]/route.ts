import type { Movie } from "../../../lib/movies";
import {
  formatCertification,
  formatRuntime,
  getLicensedEmbedUrl,
  hasTmdbCredentials,
  tmdbFetch,
  tmdbImage,
  type TmdbMediaType,
} from "../../../lib/tmdb";
import { getVidSrcServers } from "../../../lib/vidsrc";

type TmdbDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  original_language?: string;
  origin_country?: string[];
  genres?: { id: number; name: string }[];
  credits?: { cast?: { name: string }[] };
  aggregate_credits?: { cast?: { name: string }[] };
  release_dates?: {
    results?: { iso_3166_1: string; release_dates: { certification?: string }[] }[];
  };
  content_ratings?: {
    results?: { iso_3166_1: string; rating: string }[];
  };
  videos?: {
    results?: {
      key: string;
      site: string;
      type: string;
      official?: boolean;
      published_at?: string;
    }[];
  };
};

type TmdbProviders = {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: { provider_name: string }[];
      rent?: { provider_name: string }[];
      buy?: { provider_name: string }[];
    }
  >;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const mediaType = url.searchParams.get("type");
  const season = Math.max(1, Number(url.searchParams.get("season") || "1"));
  const episode = Math.max(1, Number(url.searchParams.get("episode") || "1"));

  if (!/^\d+$/.test(id) || (mediaType !== "movie" && mediaType !== "tv")) {
    return Response.json({ error: "A valid movie or TV id is required." }, { status: 400 });
  }

  const tmdbId = Number(id);
  const typedMediaType = mediaType as TmdbMediaType;
  const licensedEmbedUrl = getLicensedEmbedUrl(tmdbId, typedMediaType, season, episode);
  const servers = getVidSrcServers(tmdbId, typedMediaType, season, episode);

  if (!hasTmdbCredentials()) {
    return Response.json({
      id: tmdbId,
      embedUrl: licensedEmbedUrl,
      servers,
    });
  }

  const append =
    mediaType === "movie"
      ? "credits,release_dates,videos"
      : "aggregate_credits,content_ratings,videos";
  try {
    const [details, providerResult] = await Promise.allSettled([
      tmdbFetch<TmdbDetails>(
        `/${mediaType}/${id}?language=id-ID&append_to_response=${append}&include_video_language=en-US,null,id-ID`,
      ),
      tmdbFetch<TmdbProviders>(`/${mediaType}/${id}/watch/providers`),
    ]);

    if (details.status === "rejected") throw details.reason;

    const data = details.value;
    const providerData = providerResult.status === "fulfilled" ? providerResult.value.results?.ID : undefined;
    const providers = [
      ...(providerData?.flatrate || []),
      ...(providerData?.rent || []),
      ...(providerData?.buy || []),
    ];
    const releaseCertification = data.release_dates?.results
      ?.find((result) => result.iso_3166_1 === "ID")
      ?.release_dates.find((release) => release.certification)?.certification;
    const tvCertification = data.content_ratings?.results?.find(
      (result) => result.iso_3166_1 === "ID",
    )?.rating;
    const cast = data.credits?.cast || data.aggregate_credits?.cast || [];
    const isAnime =
      data.genres?.some((genre) => genre.id === 16) === true &&
      (data.original_language === "ja" || data.origin_country?.includes("JP") === true);
    const trailer = data.videos?.results
      ?.filter((video) => video.site === "YouTube" && video.type === "Trailer")
      .sort((left, right) => Number(Boolean(right.official)) - Number(Boolean(left.official)))[0];
    const date = mediaType === "movie" ? data.release_date : data.first_air_date;
    const runtime =
      mediaType === "movie"
        ? formatRuntime(data.runtime)
        : data.episode_run_time?.[0]
          ? `${formatRuntime(data.episode_run_time[0])} per episode`
          : `${data.number_of_seasons || 1} season`;

    const movie: Movie = {
      id: data.id,
      title: data.title || data.name || "Tanpa judul",
      year: date ? Number(date.slice(0, 4)) : 0,
      maturity: formatCertification(releaseCertification || tvCertification),
      runtime,
      rating: Number(data.vote_average || 0).toFixed(1),
      genres: data.genres?.map((genre) => genre.name) || [],
      synopsis: data.overview || "Sinopsis belum tersedia.",
      backdrop: tmdbImage(data.backdrop_path, "original"),
      poster: tmdbImage(data.poster_path),
      cast: cast.slice(0, 8).map((person) => person.name),
      type: mediaType === "tv" ? "series" : "film",
      mediaType: typedMediaType,
      isAnime,
      watchProviders: [...new Set(providers.map((provider) => provider.provider_name))],
      watchUrl: providerData?.link,
      ...(isAnime ? {} : { embedUrl: licensedEmbedUrl, servers }),
      numberOfSeasons: data.number_of_seasons || 1,
      previewUrl: trailer
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0`
        : undefined,
    };

    return Response.json(movie);
  } catch (error) {
    console.error("TMDB detail request failed:", error);
    return Response.json({
      id: tmdbId,
      embedUrl: licensedEmbedUrl,
      servers,
    });
  }
}