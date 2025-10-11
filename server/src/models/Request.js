// server/src/models/Request.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/** Đơn vị hành chính (tỉnh / huyện / xã) */
const AdministrativeUnitSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/** Địa chỉ chi tiết người dùng nhập */
const AddressSchema = new Schema(
  {
    province: { type: AdministrativeUnitSchema, required: true },
    district: { type: AdministrativeUnitSchema, required: true },
    ward:     { type: AdministrativeUnitSchema, required: true },
    street:   { type: String, required: true, trim: true }, // số nhà, tên đường
  },
  { _id: false }
);

/** Vị trí (GeoJSON Point) – bắt buộc dùng [lng, lat] */
const GeoPointSchema = new Schema(
  {
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  { _id: false }
);

const RequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },

    customerName:  { type: String, required: true, immutable: true },
    customerPhone: { type: String, required: true, immutable: true },

    address: { type: AddressSchema, required: true },

    location: { type: GeoPointSchema, default: undefined },

    movingTime: { type: Date, required: true },

    serviceType: {
      type: String,
      enum: ["STANDARD", "EXPRESS"],
      default: "STANDARD",
    },

    images: { type: [String], default: [] },

    status: {
      type: String,
      enum: [
        "PENDING_REVIEW",
        "APPROVED",
        "REJECTED",
        "IN_PROGRESS",
        "DONE",
        "CANCELLED",
      ],
      default: "PENDING_REVIEW",
    },

    notes: String,

    requestDate:       { type: Date, default: Date.now },
    estimatedDelivery: { type: Date },
    actualDelivery:    { type: Date },
  },
  {
    timestamps: true,
    // 👇 Thêm dòng này để chỉ định collection chính xác
    collection: "request",
  }
);

// Tạo index không gian cho truy vấn vị trí
RequestSchema.index({ location: "2dsphere" });

// Xuất model, liên kết rõ collection "request"
export default mongoose.model("Request", RequestSchema, "request");
