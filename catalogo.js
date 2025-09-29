import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// API key TMDb v3 (from .env: API_KEY=xxxx)
const api = process.env.API_KEY;

// Cambia tamaño si quieres (w500, w780, original, etc.)
const BASE_IMAGE_URL = "https://image.tmdb.org/t/p/w1920";

// Cuántas páginas descargar (1 página = 20 items)
const PAGES = Number(process.env.PAGES || 40);

/* =========================
   Helpers
   ========================= */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function img(path) {
  return path ? `${BASE_IMAGE_URL}${path}` : null;
}

function toGenresMap(genresArray) {
  const m = new Map();
  for (const g of genresArray || []) m.set(g.id, g.name);
  return m;
}

function mapGenreIdsToNames(ids, genresMap) {
  return (ids || []).map((id) => genresMap.get(id)).filter(Boolean);
}

/* =========================
   Fetch géneros
   ========================= */

async function fetchGenresMovies() {
  const URL = `https://api.themoviedb.org/3/genre/movie/list?api_key=${api}&language=es-ES`;
  const r = await fetch(URL);
  if (!r.ok) throw new Error(`Géneros movie: ${r.status} ${r.statusText}`);
  const d = await r.json();
  return d.genres || [];
}

async function fetchGenresTV() {
  const URL = `https://api.themoviedb.org/3/genre/tv/list?api_key=${api}&language=es-ES`;
  const r = await fetch(URL);
  if (!r.ok) throw new Error(`Géneros TV: ${r.status} ${r.statusText}`);
  const d = await r.json();
  return d.genres || [];
}

/* =========================
   Fetch Movies (popular)
   ========================= */

async function fetchMovies(genresMap) {
  let all = [];
  for (let page = 1; page <= PAGES; page++) {
    const URL = `https://api.themoviedb.org/3/movie/popular?api_key=${api}&language=es-ES&page=${page}`;
    console.log(`📥 Movies p.${page}/${PAGES}`);
    const r = await fetch(URL);
    if (!r.ok) {
      console.warn(`⚠️ Movies p.${page}: ${r.status} ${r.statusText}`);
      break;
    }
    const { results = [] } = await r.json();

    const normalized = results.map((m) => ({
      tmdb_id: m.id,
      categoria: "movie",
      title: m.title ?? m.original_title ?? "",
      original_title: m.original_title ?? null,
      overview: m.overview ?? "",
      original_language: m.original_language ?? null,
      year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
      release_date: m.release_date ?? null,
      popularity: m.popularity ?? null,
      vote_average: m.vote_average ?? null,
      vote_count: m.vote_count ?? null,
      poster: img(m.poster_path),
      backdrop: img(m.backdrop_path),
      genres: mapGenreIdsToNames(m.genre_ids, genresMap)
    }));

    all = all.concat(normalized);

    // Anti rate-limit (ajusta si te pega 429)
    await sleep(150);
  }
  return all;
}

/* =========================
   Fetch Series (popular) con categorización anime/serie
   ========================= */

async function fetchSeries(tvGenresMap) {
  let all = [];
  for (let page = 1; page <= PAGES; page++) {
    const URL = `https://api.themoviedb.org/3/tv/popular?api_key=${api}&language=es-ES&page=${page}`;
    console.log(`📥 TV p.${page}/${PAGES}`);
    const r = await fetch(URL);
    if (!r.ok) {
      console.warn(`⚠️ TV p.${page}: ${r.status} ${r.statusText}`);
      break;
    }
    const { results = [] } = await r.json();

    const normalized = results.map((s) => {
      const categoria = s.original_language === "ja" ? "anime" : "serie";
      return {
        tmdb_id: s.id,
        categoria,
        title: s.name ?? s.original_name ?? "",
        original_title: s.original_name ?? null,
        overview: s.overview ?? "",
        original_language: s.original_language ?? null,
        origin_country: s.origin_country ?? [],
        year: s.first_air_date ? Number(s.first_air_date.slice(0, 4)) : null,
        first_air_date: s.first_air_date ?? null,
        popularity: s.popularity ?? null,
        vote_average: s.vote_average ?? null,
        vote_count: s.vote_count ?? null,
        poster: img(s.poster_path),
        backdrop: img(s.backdrop_path),
        genres: mapGenreIdsToNames(s.genre_ids, tvGenresMap)
      };
    });

    all = all.concat(normalized);
    await sleep(150);
  }
  return all;
}

/* =========================
   Main: genera catalogo.json único
   ========================= */

(async () => {
  try {
    console.time("⏱️ tiempo total");
    const [genresMovieArr, genresTvArr] = await Promise.all([
      fetchGenresMovies(),
      fetchGenresTV(),
    ]);
    const genresMovie = toGenresMap(genresMovieArr);
    const genresTV = toGenresMap(genresTvArr);

    const [movies, series] = await Promise.all([
      fetchMovies(genresMovie),
      fetchSeries(genresTV),
    ]);

    const catalogo = [...movies, ...series];

    fs.writeFileSync("catalogo.json", JSON.stringify(catalogo, null, 2), "utf-8");
    console.log(`✅ Guardados ${catalogo.length} items en catalogo.json`);
    console.timeEnd("⏱️ tiempo total");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
