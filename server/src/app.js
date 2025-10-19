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
  app.use("/api", requestsRouter);
  app.use("/api", contractsRouter);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server chạy tại http://localhost:${port}`));
});
