import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Mongo connected");
  } catch (err) {
    console.error("❌ Mongo connection error:", err.message);
    process.exit(1);
  }
}
