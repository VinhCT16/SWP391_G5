// server/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo } from "./db.js";
import requestsRouter from "./routes/requests.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api", requestsRouter);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
connectMongo().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
});
