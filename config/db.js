import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;

export const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME); // 👈 usar la DB del .env
    console.log(`✅ Conectado a MongoDB en la base ${process.env.MONGO_DB_NAME}`);
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB", error);
    process.exit(1);
  }
};

export const getDB = () => db;
