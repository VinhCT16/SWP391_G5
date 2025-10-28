const mongoose = require("mongoose");

exports.connectDB = async () => {
  try {
    console.log("🔍 Database: Attempting to connect to MongoDB");
    console.log("🔍 Database: MONGODB_URI configured:", process.env.MONGODB_URI ? "Yes" : "No");
    
    if (!process.env.MONGODB_URI) {
      console.error("❌ Database: MONGODB_URI is not configured!");
      throw new Error("MONGODB_URI is not configured");
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
