import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectMongo } from "./db.js";
import requestsRouter from "./routes/requests.js";
import contractsRouter from "./routes/contracts.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

connectMongo().then(() => {
  // Mount feature routers under explicit bases
  app.use("/api/requests", requestsRouter);
  app.use("/api/contracts", contractsRouter);

  // API 404 handler for unmatched routes under /api
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal Server Error" });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server chạy tại http://localhost:${port}`));
});
