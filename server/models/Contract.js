import mongoose from "mongoose";

const contractSchema = new mongoose.Schema({
  contractId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  requestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Request", 
    required: true 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true 
  },
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Manager", 
    required: true 
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service", 
    required: true 
  },
  
  // Contract Details
  moveDetails: {
    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    moveDate: { type: Date, required: true },
    serviceType: { 
      type: String, 
      enum: ["Local Move", "Long Distance", "Commercial"],
      required: true 
    }
  },
  
  // Pricing
  pricing: {
    basePrice: { type: Number, required: true },
    additionalServices: [{
      service: String,
      price: Number
    }],
    totalPrice: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    balance: { type: Number, required: true }
  },
  
  // Payment
  paymentMethod: {
    type: { 
      type: String, 
      enum: ["cash", "credit_card", "bank_transfer", "check"],
      required: true 
    },
    details: mongoose.Schema.Types.Mixed // Store payment-specific info
  },
  
  // Contract Status
  status: { 
    type: String, 
    enum: ["draft", "pending_approval", "approved", "signed", "active", "completed", "cancelled"],
    default: "draft" 
  },
  
  // Approval Process
  approval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
    approvedAt: Date,
    rejectionReason: String,
    notes: String
  },
  
  // Signatures
  signatures: {
    customerSigned: { type: Boolean, default: false },
    managerSigned: { type: Boolean, default: false },
    signedAt: Date
  },
  
  // Terms and Conditions
  terms: {
    liability: { type: String, default: "Standard moving liability coverage" },
    cancellation: { type: String, default: "24-hour notice required for cancellation" },
    additionalTerms: String
  }
}, { timestamps: true });

export default mongoose.model("Contract", contractSchema);
