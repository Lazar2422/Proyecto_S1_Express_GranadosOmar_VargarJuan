export const UserModel = {
    collection: "users",
    schema: {
      name: String,
      email: String,
      password: String,
      role: { type: String, default: "user" },
      createdAt: Date,
    }
  };
  