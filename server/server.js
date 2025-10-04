
import express from "express";
import cors from "cors";  // ✅ sửa "form" thành "from"
import { connectMongo } from "./db.js";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());          // ✅ dùng cors() chứ không phải (cors)
app.use(express.json());

// Routes
app.use("/reviews", reviewRoutes);

// Start server
connectMongo().then(() => {
  app.listen(PORT, () => 
    console.log(`🚀 Server running at http://localhost:${PORT}`)
  );
});

