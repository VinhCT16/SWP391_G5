import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("❌ Chưa có MONGO_URI trong .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: "SWP391" }); // bạn có thể đổi tên DB ở đây nếu muốn
  console.log("✅ Đã kết nối MongoDB:", mongoose.connection.name);
}
