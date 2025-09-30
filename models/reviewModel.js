export const ReviewModel = {
    collection: "reviews",
    schema: {
      movieId: String,
      userId: String,
      title: String,
      comment: String,
      rating: Number,
      createdAt: Date,
    }
  };
  