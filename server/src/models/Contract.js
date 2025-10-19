// server/src/models/Contract.js
import mongoose from "mongoose";

const { Schema } = mongoose;

// Reuse sub-schemas structure similar to Request for consistency
const AdministrativeUnitSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    province: { type: AdministrativeUnitSchema, required: true },
    district: { type: AdministrativeUnitSchema, required: true },
    ward:     { type: AdministrativeUnitSchema, required: true },
    street:   { type: String, required: true, trim: true },
  },
  { _id: false }
);

const GeoPointSchema = new Schema(
  {
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  { _id: false }
);

const ContractSchema = new Schema(
  {
    // Link back to the originating Request
    requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },

    // Snapshot of customer/contact at time of contract creation
    customerName:  { type: String, required: true },
    customerPhone: { type: String, required: true },

    // Snapshot of move details
    address:   { type: AddressSchema, required: true },
    location:  { type: GeoPointSchema, default: undefined },
    movingTime:{ type: Date, required: true },
    serviceType: {
      type: String,
      enum: ["STANDARD", "EXPRESS"],
      default: "STANDARD",
    },
    images: { type: [String], default: [] },

    // Commercial terms
    pricing: {
      basePrice:   { type: Number, default: 0 },
      surcharges:  [{ label: String, amount: Number }],
      discount:    { type: Number, default: 0 },
      currency:    { type: String, default: "VND" },
      total:       { type: Number, default: 0 },
    },

    terms: { type: String },
    notes: { type: String },

    // Contract lifecycle focused for managers
    status: {
      type: String,
      enum: [
        "DRAFT",     // being prepared by manager
        "ISSUED",    // sent to customer
        "ACCEPTED",  // accepted by customer
        "REJECTED",  // rejected by customer
        "CANCELLED", // cancelled by manager
      ],
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true }
);

ContractSchema.index({ requestId: 1, status: 1 });

export default mongoose.model("Contract", ContractSchema);


