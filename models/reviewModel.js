export const ReviewModel = {
    collection: "reviews",
    schema: {
      movieId: String,
      userId: String,
      title: String,
      comment: String,
      rating: Number,
      likes: [],
      dislikes: [],
      createdAt: Date,
    }
  };
  