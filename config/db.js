import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;

export const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db();
    console.log("✅ Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB", error);
    process.exit(1);
  }
};

export const getDB = () => db;
