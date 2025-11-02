// server/src/models/Quote.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const QuoteSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "Request" },

    // Thông tin quãng đường
    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },

    // Cấu hình dịch vụ
    serviceType: {
      type: String,
      enum: ["STANDARD", "EXPRESS"],
      default: "STANDARD",
    },
    vehicleType: {
      type: String,
      enum: ["0.5T", "1T", "1.25T", "2T", "3.5T"],
      default: "1T",
    },
    helpers: { type: Number, default: 0 },
    extras: [{ type: String }], // wrap, climb, etc.

    // Chi tiết giá
    perKm: Number,
    total: Number,

    // Đàm phán
    negotiationHistory: [
      {
        from: { type: String, enum: ["STAFF", "CUSTOMER"] },
        price: Number,
        at: { type: Date, default: Date.now },
      },
    ],

    // Trạng thái
    status: {
      type: String,
      enum: ["PENDING", "NEGOTIATING", "STAFF_CONFIRMED"],
      default: "PENDING",
    },

    finalPrice: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Quote", QuoteSchema);
