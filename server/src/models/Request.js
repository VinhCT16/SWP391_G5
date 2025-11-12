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

    // ➜ Cho phép chỉnh sửa khi PATCH (không immutable)
    customerName:  { type: String, required: true },
    customerPhone: { type: String, required: true },

    // ✅ Tách 2 địa chỉ + 2 toạ độ
    pickupAddress:   { type: AddressSchema, required: true },
    pickupLocation:  { type: GeoPointSchema, default: undefined },
    deliveryAddress: { type: AddressSchema, required: true },
    deliveryLocation:{ type: GeoPointSchema, default: undefined },

    // ❗ Giữ trường cũ để đọc tài liệu lịch sử (DEPRECATED)
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
        "PENDING_CONFIRMATION",    // Đang chờ xác nhận (mới tạo)
        "UNDER_SURVEY",            // Đang khảo sát (staff đang khảo sát)
        "WAITING_PAYMENT",         // Chờ thanh toán (đã báo giá, chờ thanh toán)
        "IN_PROGRESS",             // Đang vận chuyển (đã thanh toán, đang chuyển)
        "DONE",                    // Đã hoàn thành
        "CANCELLED",               // Đã hủy
        "REJECTED",                // Bị từ chối
        // Backward compat
        "PENDING_REVIEW",          // Cũ, tự động map sang PENDING_CONFIRMATION
        "APPROVED",                // Cũ, tự động map sang WAITING_PAYMENT
      ],
      default: "PENDING_CONFIRMATION",
    },

    notes: String,

    surveyFee: { type: Number, default: undefined }, // Phí khảo sát (nếu có)

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

// Backward-compat khi tài liệu cũ chỉ có address/location
RequestSchema.virtual("pickupAddressCompat").get(function () {
  return this.pickupAddress || this.address || undefined;
});
RequestSchema.virtual("deliveryAddressCompat").get(function () {
  return this.deliveryAddress || this.address || undefined;
});
RequestSchema.virtual("pickupLocationCompat").get(function () {
  return this.pickupLocation || this.location || undefined;
});
RequestSchema.virtual("deliveryLocationCompat").get(function () {
  return this.deliveryLocation || this.location || undefined;
});

// Index không gian cho truy vấn khoảng cách
RequestSchema.index({ pickupLocation: "2dsphere" });
RequestSchema.index({ deliveryLocation: "2dsphere" });

export default mongoose.model("Request", RequestSchema, "request");
