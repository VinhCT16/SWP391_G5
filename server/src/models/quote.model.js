import mongoose from "mongoose";

const negotiationSchema = new mongoose.Schema({
  from: { type: String, enum: ["customer", "staff"], required: true },
  price: { type: Number, required: true },
  at: { type: Date, default: Date.now },
});

const quoteSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    basePrice: { type: Number, required: true },
    negotiatedPrice: { type: Number, default: null },
    finalPrice: { type: Number, default: null },
    status: {
      type: String,
      enum: ["DRAFT", "NEGOTIATING", "CONFIRMED", "REJECTED", "EXPIRED"],
      default: "DRAFT",
    },
    items: { type: Array, default: [] },
    vehicleType: String,
    workers: Number,
    packOption: String,
    speed: String,
    distanceKm: Number,
    durationMin: Number,
    movingTime: Date,
    negotiationHistory: [negotiationSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Quote", quoteSchema);
