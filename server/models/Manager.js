import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  employeeId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  department: { 
    type: String, 
    required: true,
    enum: ["Operations", "Customer Service", "Logistics"]
  },
  permissions: [{
    type: String,
    enum: ["approve_contracts", "manage_staff", "view_reports", "manage_services"]
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  hireDate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

export default mongoose.model("Manager", managerSchema);
