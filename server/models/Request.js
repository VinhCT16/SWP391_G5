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
  
  // Tasks
  tasks: [
    {
      taskId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
      taskType: { 
        type: String, 
        enum: ["packing", "loading", "transporting", "unloading", "unpacking"],
        required: true 
      },
      assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      transporter: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      status: { 
        type: String, 
        enum: ["pending", "assigned", "in-progress", "blocked", "overdue", "completed", "cancelled"], 
        default: "pending" 
      },
      estimatedDuration: Number, // in hours
      actualDuration: Number,
      priority: { 
        type: String, 
        enum: ["low", "medium", "high"], 
        default: "medium" 
      },
      description: String,
      deadline: Date,
      managerNotes: String,
      customerNotes: String,
      attachments: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
      }],
      taskHistory: [
        {
          historyId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
          status: String,
          notes: String,
          updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          updatedAt: { type: Date, default: Date.now }
        }
      ]
    }
  ],
  
  // Request Status
  status: { 
    type: String, 
    enum: ["draft", "submitted", "under_review", "approved", "rejected", "contract_created", "in_progress", "completed", "cancelled"], 
    default: "draft" 
  },
  
  // Approval
  approval: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
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
  }
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
