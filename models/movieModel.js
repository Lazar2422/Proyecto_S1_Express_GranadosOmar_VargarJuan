export const MovieModel = {
  collection: "movies",
  schema: {
    tmdb_id: Number,
    categoria: String,
    title: String,
    original_title: String,
    overview: String,
    original_language: String,
    year: Number,
    release_date: Date,
    popularity: Number,
    vote_average: Number,
    vote_count: Number,
    poster: String,
    backdrop: String,
    genres: [String],
    createdAt: Date,
    approvedAt: Date // opcional, para registro histórico
  }
};
