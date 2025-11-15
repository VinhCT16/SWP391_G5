const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  requestId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  // Customer info (for querying by phone)
  customerName: { type: String },
  customerPhone: { type: String },
  
  // Move Details
  moveDetails: {
    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    moveDate: { type: Date, required: true },
    serviceType: { 
      type: String, 
      enum: ["Local Move", "Long Distance", "Commercial"],
      required: true 
    },
    phone: { type: String, required: true }
  },
  
  // Items to Move
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      category: { 
        type: String, 
        enum: ["furniture", "electronics", "clothing", "kitchen", "books", "other"],
        default: "other"
      },
      estimatedValue: Number,
      requiresSpecialHandling: { type: Boolean, default: false }
    }
  ],
  
  // Contract Reference
  contractId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Contract" 
  },

  // Staff Assignment at Request Level (before contract)
  assignedStaff: [{
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    assignedAt: { type: Date, default: Date.now },
    notes: String
  }],
  
  // Tasks are now in a separate Task model, referenced by requestId
  
  // Request Status
  status: { 
    type: String, 
    enum: ["draft", "submitted", "under_review", "approved", "rejected", "contract_created", "in_progress", "completed", "cancelled", "UNDER_SURVEY", "PENDING", "PENDING_CONFIRMATION", "WAITING_PAYMENT", "IN_PROGRESS", "DONE", "CANCELLED", "REJECTED", "PENDING_REVIEW"], 
    default: "draft" 
  },
  
  // Approval
  approval: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    approved: Boolean,
    rejectionReason: String,
    notes: String
  },
  
  // Pricing Estimate
  estimatedPrice: {
    basePrice: Number,
    additionalServices: [{
      service: String,
      price: Number
    }],
    totalPrice: Number
  },

  // Survey fee (for staff survey requests)
  surveyFee: { type: Number, default: undefined },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ["cash", "online_banking"],
    default: "cash"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "deposit_paid", "fully_paid", "not_paid"],
    default: "pending"
  },
  depositPaid: {
    type: Boolean,
    default: false
  },
  depositPaidAt: Date,
  depositPaidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Staff who marked deposit as paid
  },
  // VNPay transaction info
  vnpayTransaction: {
    transactionId: String,
    amount: Number,
    orderInfo: String,
    paymentDate: Date,
    responseCode: String,
    transactionStatus: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
