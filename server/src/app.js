import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectMongo } from "./db.js";
import requestsRouter from "./routes/requests.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

connectMongo().then(() => {
  app.use("/api", requestsRouter);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server chạy tại http://localhost:${port}`));
});
