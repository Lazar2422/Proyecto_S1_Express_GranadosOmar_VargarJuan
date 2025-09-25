export const UserModel = {
    collection: "users",
    schema: {
      username: String,
      email: String,
      password: String,
      role: { type: String, default: "user" },
      createdAt: Date,
    }
  };
  