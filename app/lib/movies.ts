import { getVidSrcServers, getVidSrcUrl } from "./vidsrc";

export type MovieServer = {
  id: string;
  name: string;
  badge?: string;
  url: string;
};

export type Movie = {
  id: number;
  title: string;
  year: number;
  maturity: string;
  runtime: string;
  rating: string;
  genres: string[];
  synopsis: string;
  backdrop: string;
  poster: string;
  cast: string[];
  type?: "film" | "series";
  mediaType?: "movie" | "tv";
  watchProviders?: string[];
  watchUrl?: string;
  embedUrl?: string;
  previewUrl?: string;
  playbackUrl?: string;
  license?: string;
  licenseUrl?: string;
  attribution?: string;
  servers?: MovieServer[];
  numberOfSeasons?: number;
};

export type MovieSections = {
  trending: number[];
  topRated: number[];
  series: number[];
  action: number[];
  comedy: number[];
};

const image = (path: string, size: "w500" | "original" = "w500") =>
  `https://image.tmdb.org/t/p/${size}/${path}`;

export const movies: Movie[] = [
  {
    id: 693134,
    title: "Dune: Part Two",
    year: 2024,
    maturity: "13+",
    runtime: "2j 46m",
    rating: "8.6",
    genres: ["Sci-Fi", "Petualangan"],
    synopsis:
      "Paul Atreides bersatu dengan Chani dan kaum Fremen dalam perjalanan membalas kehancuran keluarganya. Di tengah gurun Arrakis, ia harus memilih antara cinta dan takdir yang dapat mengubah semesta.",
    backdrop: image("xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", "original"),
    poster: image("1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"),
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(693134, "movie"),
    servers: getVidSrcServers(693134, "movie"),
  },
  {
    id: 872585,
    title: "Oppenheimer",
    year: 2023,
    maturity: "17+",
    runtime: "3j 00m",
    rating: "8.3",
    genres: ["Drama", "Sejarah"],
    synopsis:
      "Kisah J. Robert Oppenheimer dan tim ilmuwan yang berpacu dengan waktu untuk merancang senjata yang akan mengubah jalannya sejarah dunia.",
    backdrop: image("fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", "original"),
    poster: image("ptpr0kGAckfQkJeJIt8st5dglvd.jpg"),
    cast: ["Cillian Murphy", "Emily Blunt", "Robert Downey Jr."],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(872585, "movie"),
    servers: getVidSrcServers(872585, "movie"),
  },
  {
    id: 414906,
    title: "The Batman",
    year: 2022,
    maturity: "13+",
    runtime: "2j 56m",
    rating: "7.8",
    genres: ["Aksi", "Misteri"],
    synopsis:
      "Saat seorang pembunuh berantai meneror Gotham, Batman mengikuti jejak petunjuk yang membawanya ke jantung korupsi kota dan rahasia keluarganya sendiri.",
    backdrop: image("b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg", "original"),
    poster: image("74xTEgt7R36Fpooo50r9T25onhq.jpg"),
    cast: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(414906, "movie"),
    servers: getVidSrcServers(414906, "movie"),
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    maturity: "7+",
    runtime: "2j 20m",
    rating: "8.6",
    genres: ["Animasi", "Aksi"],
    synopsis:
      "Miles Morales melintasi multiverse dan bertemu tim Spider-People yang bertugas melindungi keberadaannya. Namun, perbedaan cara pandang segera mengubah misi menjadi pertarungan.",
    backdrop: image("4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", "original"),
    poster: image("8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"),
    cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(569094, "movie"),
    servers: getVidSrcServers(569094, "movie"),
  },
  {
    id: 157336,
    title: "Interstellar",
    year: 2014,
    maturity: "13+",
    runtime: "2j 49m",
    rating: "8.7",
    genres: ["Sci-Fi", "Drama"],
    synopsis:
      "Ketika Bumi kian sulit dihuni, seorang pilot bergabung dengan misi melintasi galaksi demi mencari rumah baru bagi umat manusia, sekaligus mempertaruhkan waktu bersama keluarganya.",
    backdrop: image("xJHokMbljvjADYdit5f5KVQsXEG.jpg", "original"),
    poster: image("gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"),
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(157336, "movie"),
    servers: getVidSrcServers(157336, "movie"),
  },
  {
    id: 361743,
    title: "Top Gun: Maverick",
    year: 2022,
    maturity: "13+",
    runtime: "2j 11m",
    rating: "8.2",
    genres: ["Aksi", "Drama"],
    synopsis:
      "Setelah lebih dari tiga puluh tahun mengabdi, Maverick melatih para pilot elite untuk sebuah misi yang mustahil dan menghadapi bayang-bayang masa lalunya.",
    backdrop: image("odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg", "original"),
    poster: image("62HCnUTziyWcpDaBO2i1DX17ljH.jpg"),
    cast: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(361743, "movie"),
    servers: getVidSrcServers(361743, "movie"),
  },
  {
    id: 87739,
    title: "The Queen's Gambit",
    year: 2020,
    maturity: "17+",
    runtime: "1 season",
    rating: "8.5",
    genres: ["Drama", "Series"],
    synopsis:
      "Di tengah dunia catur kompetitif yang didominasi pria, seorang pecatur muda jenius mengejar puncak sambil bergulat dengan kesepian dan ketergantungan.",
    backdrop: image("zU0htwkhNvBQdVSIKB9s6hgVeFK.jpg", "original"),
    poster: image("34OGjFEbHj0E3lE2w0iTUVq0CBz.jpg"),
    cast: ["Anya Taylor-Joy", "Bill Camp", "Moses Ingram"],
    type: "series",
    mediaType: "tv",
    embedUrl: getVidSrcUrl(87739, "tv", undefined, 1, 1),
    servers: getVidSrcServers(87739, "tv", 1, 1),
    numberOfSeasons: 1,
  },
  {
    id: 100088,
    title: "The Last of Us",
    year: 2023,
    maturity: "17+",
    runtime: "1 season",
    rating: "8.7",
    genres: ["Drama", "Series"],
    synopsis:
      "Dua puluh tahun setelah peradaban runtuh, Joel diminta mengantar Ellie keluar dari zona karantina. Perjalanan berbahaya itu perlahan menjadi ikatan yang tak terduga.",
    backdrop: image("uDgy6hyPd82kOHh6I95FLtLnj6p.jpg", "original"),
    poster: image("uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg"),
    cast: ["Pedro Pascal", "Bella Ramsey", "Anna Torv"],
    type: "series",
    mediaType: "tv",
    embedUrl: getVidSrcUrl(100088, "tv", undefined, 1, 1),
    servers: getVidSrcServers(100088, "tv", 1, 1),
    numberOfSeasons: 2,
  },
  {
    id: 546554,
    title: "Knives Out",
    year: 2019,
    maturity: "13+",
    runtime: "2j 10m",
    rating: "7.9",
    genres: ["Misteri", "Komedi"],
    synopsis:
      "Detektif Benoit Blanc menyelidiki kematian seorang novelis terkenal. Semua anggota keluarga punya motif, dan tak satu pun dari mereka menceritakan seluruh kebenaran.",
    backdrop: image("q3Ep5o8Jclo6rE9K2s5tKc9x5ww.jpg", "original"),
    poster: image("pThyQovXQrw2m0s9x82twj48Jq4.jpg"),
    cast: ["Daniel Craig", "Ana de Armas", "Chris Evans"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(546554, "movie"),
    servers: getVidSrcServers(546554, "movie"),
  },
  {
    id: 666277,
    title: "Past Lives",
    year: 2023,
    maturity: "13+",
    runtime: "1j 46m",
    rating: "7.9",
    genres: ["Romansa", "Drama"],
    synopsis:
      "Dua sahabat masa kecil yang terpisah bertemu kembali bertahun-tahun kemudian di New York dan merenungkan pilihan hidup, kehilangan, serta hubungan yang tak selesai.",
    backdrop: image("k3waqVXSnvCZWfJYNtdamTgTtTA.jpg", "original"),
    poster: image("k3waqVXSnvCZWfJYNtdamTgTtTA.jpg"),
    cast: ["Greta Lee", "Teo Yoo", "John Magaro"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(666277, "movie"),
    servers: getVidSrcServers(666277, "movie"),
  },
  {
    id: 940721,
    title: "Godzilla Minus One",
    year: 2023,
    maturity: "13+",
    runtime: "2j 04m",
    rating: "8.3",
    genres: ["Aksi", "Sci-Fi"],
    synopsis:
      "Jepang pascaperang yang belum pulih menghadapi ancaman baru saat Godzilla muncul. Seorang mantan pilot harus menemukan keberanian untuk melindungi orang-orang yang tersisa.",
    backdrop: image("hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg", "original"),
    poster: image("hkxxMIGaiCTmrEArK7J56JTKUlB.jpg"),
    cast: ["Ryunosuke Kamiki", "Minami Hamabe", "Yuki Yamada"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(940721, "movie"),
    servers: getVidSrcServers(940721, "movie"),
  },
  {
    id: 120467,
    title: "The Grand Budapest Hotel",
    year: 2014,
    maturity: "13+",
    runtime: "1j 39m",
    rating: "8.1",
    genres: ["Komedi", "Petualangan"],
    synopsis:
      "Seorang concierge legendaris dan staf hotelnya terseret dalam pencurian lukisan bernilai tinggi, perebutan warisan, dan petualangan lintas Eropa yang ganjil.",
    backdrop: image("nX5XotM9yprCKarRH4fzOq1VM1J.jpg", "original"),
    poster: image("eWdyYQreja6JGCzqHWXpWHDrrPo.jpg"),
    cast: ["Ralph Fiennes", "Tony Revolori", "Saoirse Ronan"],
    type: "film",
    mediaType: "movie",
    embedUrl: getVidSrcUrl(120467, "movie"),
    servers: getVidSrcServers(120467, "movie"),
  },
];

export const trendingMovies = movies.slice(0, 6);