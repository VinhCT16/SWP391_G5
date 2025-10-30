const express = require("express");
const reviewRoutes = require("./routes/reviewRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");


dotenv.config();

const app = express();

// Middlewares
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://3.106.202.106:3000",
    "http://3.106.202.106:3001",
    "https://api-agritrack.ungdunghay.info.vn"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/contracts", require("./routes/contractRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/reviews", reviewRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});
// Start server after DB connect
const port = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
});


