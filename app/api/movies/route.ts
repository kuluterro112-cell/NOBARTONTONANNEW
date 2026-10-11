import type { MovieSections } from "../../lib/movies";
import {
  hasTmdbCredentials,
  mapTmdbListItem,
  tmdbFetch,
  type TmdbGenreList,
  type TmdbMediaType,
  type TmdbPage,
} from "../../lib/tmdb";

const language = "language=id-ID&page=1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (query) {
    if (query.length > 120) {
      return Response.json({ error: "Search query must be 120 characters or fewer." }, { status: 400 });
    }
    if (!hasTmdbCredentials()) {
      return Response.json({ error: "TMDB credentials are not configured." }, { status: 503 });
    }

    try {
      const [searchPages, movieGenres, tvGenres] = await Promise.all([
        Promise.all(
          [1, 2, 3].map((page) =>
            tmdbFetch<TmdbPage>(
              `/search/multi?query=${encodeURIComponent(query)}&language=id-ID&page=${page}`,
            ),
          ),
        ),
        tmdbFetch<TmdbGenreList>("/genre/movie/list?language=id-ID"),
        tmdbFetch<TmdbGenreList>("/genre/tv/list?language=id-ID"),
      ]);

      const movieGenreMap = new Map(movieGenres.genres.map((genre) => [genre.id, genre.name]));
      const tvGenreMap = new Map(tvGenres.genres.map((genre) => [genre.id, genre.name]));
      const results = new Map<string, ReturnType<typeof mapTmdbListItem>>();
      for (const page of searchPages) {
        for (const item of page.results) {
          if (item.media_type !== "movie" && item.media_type !== "tv") continue;
          const mediaType = item.media_type;
          const movie = mapTmdbListItem(
            item,
            mediaType,
            mediaType === "tv" ? tvGenreMap : movieGenreMap,
          );
          results.set(`${mediaType}:${movie.id}`, movie);
        }
      }

      return Response.json({ movies: [...results.values()] });
    } catch (error) {
      console.error("TMDB search request failed:", error);
      return Response.json({ error: "Unable to search the TMDB catalogue." }, { status: 502 });
    }
  }

  if (!hasTmdbCredentials()) {
    return Response.json({ error: "TMDB credentials are not configured." }, { status: 503 });
  }

  try {
    const [trending, popularMovies, topRated, popularSeries, action, comedy, movieGenres, tvGenres] =
      await Promise.all([
        tmdbFetch<TmdbPage>(`/trending/all/week?${language}`),
        tmdbFetch<TmdbPage>(`/movie/popular?${language}`),
        tmdbFetch<TmdbPage>(`/movie/top_rated?${language}`),
        tmdbFetch<TmdbPage>(`/tv/popular?${language}`),
        tmdbFetch<TmdbPage>(`/discover/movie?${language}&with_genres=28&sort_by=popularity.desc`),
        tmdbFetch<TmdbPage>(`/discover/movie?${language}&with_genres=35&sort_by=popularity.desc`),
        tmdbFetch<TmdbGenreList>(`/genre/movie/list?language=id-ID`),
        tmdbFetch<TmdbGenreList>(`/genre/tv/list?language=id-ID`),
      ]);

    const movieGenreMap = new Map(movieGenres.genres.map((genre) => [genre.id, genre.name]));
    const tvGenreMap = new Map(tvGenres.genres.map((genre) => [genre.id, genre.name]));
    const catalogue = new Map<string, ReturnType<typeof mapTmdbListItem>>();
    const sections: MovieSections = {
      trending: [],
      topRated: [],
      series: [],
      action: [],
      comedy: [],
    };

    function addPage(
      page: TmdbPage,
      section: keyof MovieSections,
      defaultType?: TmdbMediaType,
      limit = 12,
    ) {
      for (const item of page.results.slice(0, limit)) {
        if (item.media_type === "person") continue;
        const mediaType = defaultType || (item.media_type === "tv" ? "tv" : "movie");
        const movie = mapTmdbListItem(item, mediaType, mediaType === "tv" ? tvGenreMap : movieGenreMap);
        const key = `${mediaType}:${movie.id}`;
        if (!catalogue.has(key)) catalogue.set(key, movie);
        if (!sections[section].includes(movie.id)) sections[section].push(movie.id);
      }
    }

    addPage(trending, "trending", undefined, 14);
    addPage(popularMovies, "trending", "movie", 8);
    addPage(topRated, "topRated", "movie");
    addPage(popularSeries, "series", "tv");
    addPage(action, "action", "movie");
    addPage(comedy, "comedy", "movie");

    return Response.json({ movies: [...catalogue.values()], sections });
  } catch (error) {
    console.error("TMDB catalogue request failed:", error);
    return Response.json({ error: "Unable to load catalogue from TMDB." }, { status: 502 });
  }
}