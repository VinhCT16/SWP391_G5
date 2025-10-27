// server/src/models/Quote.js
import mongoose from "mongoose";

const QuoteItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    weightKg: Number,
    volumeM3: Number,
    bulky: { type: Boolean, default: false },
    floorsFrom: { type: Number, default: 0 },
    floorsTo: { type: Number, default: 0 },
  },
  { _id: false }
);

const NegotiationSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["customer", "staff"], required: true },
    price: { type: Number, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuoteSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "request", required: true, index: true },
    items: { type: [QuoteItemSchema], default: [] },

    vehicleType: { type: String, enum: ["truck_750kg", "truck_1t25", "truck_2t"], required: true },
    workers: { type: Number, min: 0, default: 2 },
    packOption: { type: String, enum: ["customer_self_pack", "standard_pack", "premium_pack"], default: "customer_self_pack" },
    speed: { type: String, enum: ["standard", "express"], default: "standard" },

    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },

    breakdown: {
      distanceFee: Number,
      laborFee: Number,
      packingFee: Number,
      stairsFee: Number,
      nightFee: Number,
      speedMultiplier: Number,
    },

    total: { type: Number, required: true },
    currency: { type: String, default: "VND" },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SENT",
        "NEGOTIATING",
        "CUSTOMER_CONFIRMED",
        "STAFF_CONFIRMED",
        "CANCELLED",
        "EXPIRED",
      ],
      default: "DRAFT",
    },

    negotiationHistory: { type: [NegotiationSchema], default: [] },
    finalPrice: { type: Number, default: null },
    createdBy: { type: String },
  },
  { timestamps: true, collection: "quote" }
);

export default mongoose.model("quote", QuoteSchema);
