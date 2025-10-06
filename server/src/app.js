// server/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo } from "./db.js";
import requestsRouter from "./routes/requests.js";

dotenv.config();
const app = express();

app.use(cors());
// tăng limit để nhận tối đa ~8MB JSON (4 ảnh base64 ~1.5MB/ảnh)
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api", requestsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
connectMongo().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
});
