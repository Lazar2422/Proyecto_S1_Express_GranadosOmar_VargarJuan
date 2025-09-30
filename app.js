import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import catalogoRoutes from "./routes/catalogoRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import genreRoutes from "./routes/genreRoutes.js";

dotenv.config();
const app = express();

// CORS: permitir acceso desde Live Server
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/catalogo", catalogoRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1", genreRoutes);

// Manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

export default app;

app.use(notFound);
app.use(errorHandler);