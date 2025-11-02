const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaintId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: new mongoose.Types.ObjectId() 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  customerEmail: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ["pending", "in_progress", "resolved", "closed"], 
    default: "pending" 
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
  category: { 
    type: String, 
    enum: ["service_quality", "billing", "technical", "general", "other"], 
    default: "general" 
  },
  adminResponse: {
    response: { type: String, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminName: { type: String },
    respondedAt: { type: Date }
  },
  adminNotes: { 
    type: String, 
    trim: true 
  },
  resolution: {
    resolution: { type: String, trim: true },
    resolvedAt: { type: Date },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true 
});

// Index for better query performance
complaintSchema.index({ customerId: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Complaint", complaintSchema);
