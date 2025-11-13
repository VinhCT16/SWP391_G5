const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema({
  historyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: new mongoose.Types.ObjectId() 
  },
  status: String,
  notes: String,
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  name: String,
  url: String,
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const taskSchema = new mongoose.Schema(
  {
    // Reference to Request
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true
    },
    
    // Task Type
    taskType: {
      type: String,
      enum: ["packing", "transporting", "review"], // Temporarily simplified: only packing and transporting (review kept for existing review tasks)
      required: true
    },
    
    // Staff Assignment
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    
    transporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    
    // Status
    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "blocked", "overdue", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    
    // Duration
    estimatedDuration: Number, // in hours
    actualDuration: Number,
    
    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    
    // Description and Notes
    description: String,
    managerNotes: String,
    customerNotes: String,
    
    // Deadline
    deadline: Date,
    
    // Attachments
    attachments: [attachmentSchema],
    
    // Task History
    taskHistory: [taskHistorySchema]
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Indexes for better query performance
taskSchema.index({ requestId: 1, status: 1 });
taskSchema.index({ assignedStaff: 1, status: 1 });
taskSchema.index({ transporter: 1, status: 1 });
taskSchema.index({ taskType: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);

