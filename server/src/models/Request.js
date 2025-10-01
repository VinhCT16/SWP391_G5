import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    customerName: { type: String, required: true, immutable: true },
    customerPhone: { type: String, required: true, immutable: true }, 
    address: { type: String, required: true },

    movingTime: { type: Date, required: true },
    serviceType: { type: String, enum: ["STANDARD", "EXPRESS"], default: "STANDARD" },

    images: [String], // lưu base64 (demo) / URL sau

    status: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "IN_PROGRESS", "DONE", "CANCELLED"],
      default: "PENDING_REVIEW",
    },

    notes: String,
    requestDate: { type: Date, default: Date.now },
    estimatedDelivery: Date,
    actualDelivery: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Request", RequestSchema);
