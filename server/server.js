const express = require("express");
const reviewRoutes = require("./routes/reviewRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const http = require("http");


dotenv.config();

const app = express();

// Middlewares
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3001",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(cookieParser());

// Middleware to handle cookie size issues - clear if too many cookies
app.use((req, res, next) => {
  if (req.headers.cookie) {
    const cookieCount = req.headers.cookie.split(';').length;
    // If there are too many cookies, clear old ones
    if (cookieCount > 10) {
      // Clear all cookies except the access_token
      const cookies = req.headers.cookie.split(';');
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name !== 'access_token') {
          res.clearCookie(name);
        }
      });
    }
  }
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/contracts", require("./routes/contractRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/api/reviews", reviewRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});
// Start server after DB connect
const port = process.env.PORT || 3000;
connectDB().then(() => {
  // Create HTTP server with increased header size limit
  const server = http.createServer(app);
  
  // Increase max header size (default is 8KB, increasing to 32KB)
  if (server.maxHeaderSize !== undefined) {
    server.maxHeaderSize = 32768; // 32KB
  }
  
  server.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    console.log(`📝 Max header size: ${server.maxHeaderSize || 'default'} bytes`);
  });
});


