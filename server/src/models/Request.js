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
    coordinates: { type: [Number], default: undefined }, // [lng, lat] – có thể chưa có
  },
  { _id: false }
);

const RequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },

    customerName:  { type: String, required: true, immutable: true },
    customerPhone: { type: String, required: true, immutable: true },

    // 🆕 TÁCH ĐỊA CHỈ
    pickupAddress:   { type: AddressSchema, required: true },
    pickupLocation:  { type: GeoPointSchema, default: undefined },
    deliveryAddress: { type: AddressSchema, required: true },
    deliveryLocation:{ type: GeoPointSchema, default: undefined },

    movingTime: { type: Date, required: true },

    serviceType: {
      type: String,
      enum: ["STANDARD", "EXPRESS"], // Thường / Hỏa tốc
      default: "STANDARD",
    },

    // Lưu base64 (demo) hoặc URL sau này – tối đa 4 ảnh bên phía routes validate
    images: { type: [String], default: [] },

    status: {
      type: String,
      enum: [
        "PENDING_REVIEW", // Đang chờ duyệt
        "APPROVED",       // Đã duyệt
        "REJECTED",       // Bị từ chối
        "IN_PROGRESS",    // Đang thực hiện
        "DONE",           // Hoàn tất
        "CANCELLED",      // Đã hủy
      ],
      default: "PENDING_REVIEW",
    },

    notes: String,

    // 3 field dưới có thể dùng trong luồng nghiệp vụ khác
    requestDate:       { type: Date, default: Date.now },
    estimatedDelivery: { type: Date },
    actualDelivery:    { type: Date },
  },
  {
    timestamps: true,
    collection: "request", // ép đúng collection 'request' trong DB SWP391
  }
);

// Index không gian cho truy vấn theo vị trí (phục vụ báo giá theo khoảng cách sau này)
RequestSchema.index({ pickupLocation: "2dsphere" });
RequestSchema.index({ deliveryLocation: "2dsphere" });

// Chống cache model & buộc dùng collection 'request'
export default mongoose.models.Request ||
  mongoose.model("Request", RequestSchema, "request");
