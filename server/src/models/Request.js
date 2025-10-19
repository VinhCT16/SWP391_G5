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
    street:   { type: String, required: true, trim: true },
  },
  { _id: false }
);

/** Điểm toạ độ GeoJSON: [lng, lat] */
const GeoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: "coordinates phải là mảng [lng, lat]"
      }
    }
  },
  { _id: false }
);

const RequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },

    customerName:  { type: String, required: true, immutable: true },
    customerPhone: { type: String, required: true, immutable: true },

    // ✅ TÁCH THÀNH 2 ĐỊA CHỈ & 2 TOẠ ĐỘ
    pickupAddress:   { type: AddressSchema, required: true },
    pickupLocation:  { type: GeoPointSchema, default: undefined },
    deliveryAddress: { type: AddressSchema, required: true },
    deliveryLocation:{ type: GeoPointSchema, default: undefined },

    // ❗ Giữ lại trường cũ để đọc tài liệu lịch sử (DEPRECATED)
    address:  { type: AddressSchema, required: false },     // deprecated
    location: { type: GeoPointSchema, default: undefined }, // deprecated

    movingTime: { type: Date, required: true },

    serviceType: {
      type: String,
      enum: ["STANDARD", "EXPRESS"],
      default: "STANDARD",
    },

    images: [String],

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
    collection: "request",
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// 👉 Backward-compat khi tài liệu cũ chỉ có address/location
RequestSchema.virtual("pickupAddressCompat").get(function () {
  return this.pickupAddress || this.address || undefined;
});
RequestSchema.virtual("deliveryAddressCompat").get(function () {
  // Nếu không có deliveryAddress, tạm thời dùng address (cũ) như cả 2 để hiển thị
  return this.deliveryAddress || this.address || undefined;
});
RequestSchema.virtual("pickupLocationCompat").get(function () {
  return this.pickupLocation || this.location || undefined;
});
RequestSchema.virtual("deliveryLocationCompat").get(function () {
  return this.deliveryLocation || this.location || undefined;
});

// Index không gian cho truy vấn khoảng cách trong tương lai
RequestSchema.index({ pickupLocation: "2dsphere" });
RequestSchema.index({ deliveryLocation: "2dsphere" });

export default mongoose.model("Request", RequestSchema, "request");
