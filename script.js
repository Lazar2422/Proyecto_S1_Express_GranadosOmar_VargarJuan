import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
// definimos la api key desde la variable de entorno
const api = process.env.API_KEY;
// definimos el link inicial de la imagen
const BASE_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// Función para traer los géneros
async function fetchGenres() {
  // url de todos los generos
  const URL = `https://api.themoviedb.org/3/genre/movie/list?api_key=${api}&language=es-ES`;
  const response = await fetch(URL);
  const data = await response.json();

  // Array de {id, name}
  const allGenres = data.genres; 

  // creamos el archivo json de los generos
  fs.writeFileSync("generos.json", JSON.stringify(allGenres, null, 2), "utf-8");
  console.log(`✅ Guardados ${allGenres.length} géneros en generos.json`);

  return allGenres;
}

// Función para traer películas y reemplazar poster_path y genre_ids
async function fetchMovies(genres) {
  let allMovies = [];
  // hacemos el for para indicar la cantidad de peliculas nos va a traer
  // 1 pagina = 20 peliculas
  for (let page = 1; page <= 40; page++) {
    const URL = `https://api.themoviedb.org/3/movie/popular?api_key=${api}&language=es-ES&page=${page}`;
    console.log(`📥 Descargando página ${page}...`);

    const response = await fetch(URL);
    const data = await response.json();

    const moviesProcessed = data.results.map(movie => {
      // Reemplazamos genre_ids por solo nombres
      const genreNames = movie.genre_ids
        .map(id => {
          const g = genres.find(genre => genre.id === id);
          return g ? g.name : null;
        })
        .filter(name => name !== null);

      return {
        ...movie,
        poster_path: movie.poster_path
          ? `${BASE_IMAGE_URL}${movie.poster_path}`
          : null,
        backdrop_path: movie.backdrop_path
          ? `${BASE_IMAGE_URL}${movie.backdrop_path}`
          : null,
        genres: genreNames, // ahora es solo array de nombres
      };
    });

    allMovies = allMovies.concat(moviesProcessed);
  }

  fs.writeFileSync("peliculas.json", JSON.stringify(allMovies, null, 2), "utf-8");
  console.log(`✅ Guardadas ${allMovies.length} películas en peliculas.json`);
}

// Ejecutamos todo
(async () => {
  const genres = await fetchGenres();
  await fetchMovies(genres);
})();
