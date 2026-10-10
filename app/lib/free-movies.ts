import type { Movie } from "./movies";

const creativeCommonsBy = "https://creativecommons.org/licenses/by/3.0/";

export const freeMovies: Movie[] = [
  {
    id: -1,
    title: "Big Buck Bunny",
    year: 2008,
    maturity: "Semua umur",
    runtime: "9m 56dtk",
    rating: "—",
    genres: ["Animasi", "Komedi", "Petualangan"],
    synopsis:
      "Seekor kelinci besar yang menyukai ketenangan berhadapan dengan tiga hewan pengerat usil di padang rumput.",
    poster: "https://archive.org/download/BigBuckBunny_328/__ia_thumb.jpg",
    backdrop: "https://archive.org/download/BigBuckBunny_328/__ia_thumb.jpg",
    cast: [],
    playbackUrl: "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4",
    license: "Creative Commons Attribution 3.0",
    licenseUrl: creativeCommonsBy,
    attribution: "Big Buck Bunny © Blender Foundation. Sertakan kredit film saat menayangkan.",
    watchUrl: "https://peach.blender.org/about/",
  },
  {
    id: -2,
    title: "Sintel",
    year: 2010,
    maturity: "Semua umur",
    runtime: "14m 48dtk",
    rating: "—",
    genres: ["Animasi", "Fantasi", "Petualangan"],
    synopsis:
      "Seorang gadis muda memulai perjalanan berbahaya untuk menemukan kembali naga kecil yang pernah ia selamatkan.",
    poster: "https://archive.org/download/Sintel/Poster.jpg",
    backdrop: "https://archive.org/download/Sintel/Poster.jpg",
    cast: [],
    playbackUrl: "https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4",
    license: "Creative Commons Attribution 3.0",
    licenseUrl: creativeCommonsBy,
    attribution: "Sintel © Blender Foundation. Sertakan kredit film saat menayangkan.",
    watchUrl: "https://durian.blender.org/about/",
  },
];