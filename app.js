import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import catalogoRoutes from "./routes/catalogoRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();
const app = express();

// CORS: permitir acceso desde Live Server
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));

app.use(express.json());
import "./config/passport.js";
app.use(passport.initialize());

// Rutas
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/catalogo", catalogoRoutes);
app.use("/api/v1/reviews", reviewRoutes);

// Manejo de errores
app.use(errorHandler);

export default app;
