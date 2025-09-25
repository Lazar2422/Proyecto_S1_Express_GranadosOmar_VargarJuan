import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import pendingRoutes from "./routes/pendingRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

import "./config/passport.js";
app.use(passport.initialize());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/movies", movieRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/pending", pendingRoutes);

app.use(errorHandler);

export default app;
