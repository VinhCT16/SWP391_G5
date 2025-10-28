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

const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ["http://localhost:3000", "http://localhost:3001"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/contracts", require("./routes/contractRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/reviews", reviewRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});
// Start server after DB connect
const port = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
});


