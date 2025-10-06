const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));

// Start server after DB connect
const port = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
});


