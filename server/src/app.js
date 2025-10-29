import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectMongo } from "./db.js";
import requestsRouter from "./routes/requests.js";
import quotesRoutes from "./routes/quotes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

// 👉 Prefix nào thì endpoint bên trong router phải nối tiếp theo prefix này
app.use("/api/quotes", quotesRoutes); // => /api/quotes/estimate, /api/quotes/:id, ...
app.use("/api", requestsRouter);

connectMongo().then(() => {
  const port = process.env.PORT || 3001; // DÙNG 3001
  app.listen(port, () => {
    console.log(`🚀 Server chạy tại http://localhost:${port}`);
    console.log(`📊 API endpoints:`);
    console.log(`   - GET  http://localhost:${port}/api/quotes/_ping`);
    console.log(`   - POST http://localhost:${port}/api/quotes/estimate`);
    console.log(`   - POST http://localhost:${port}/api/requests`);
    console.log(`   - GET  http://localhost:${port}/api/requests?phone=xxx`);
  });
});
