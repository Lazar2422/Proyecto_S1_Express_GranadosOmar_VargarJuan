export const CatalogoModel = {
  collection: "catalogo",
  schema: {
    tmdb_id: Number,
    categoria: String,          // "movie" | "series" | "anime"
    title: String,
    original_title: String,
    overview: String,
    original_language: String,
    year: Number,
    release_date: Date,
    popularity: Number,
    vote_average: Number,       // externo (TMDB)
    vote_count: Number,         // externo (TMDB)
    poster: String,
    backdrop: String,
    genres: [String],

    user_votes: {               // interno (calculado por reseñas)
      average_rating: Number,
      vote_count: Number
    },

    createdAt: Date,
    approvedAt: Date
  }
};
