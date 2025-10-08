import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
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
  role: { 
    type: String, 
    required: true,
    enum: ["packager", "transporter", "supervisor"]
  },
  specialization: [{
    type: String,
    enum: ["fragile_items", "heavy_items", "electronics", "furniture", "local_moves", "long_distance"]
  }],
  availability: {
    isAvailable: { type: Boolean, default: true },
    workingHours: {
      start: { type: String, default: "08:00" },
      end: { type: String, default: "17:00" }
    },
    workDays: [{
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }]
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 5 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  hireDate: { 
    type: Date, 
    default: Date.now 
  },
  currentTasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Request" 
  }]
}, { timestamps: true });

export default mongoose.model("Staff", staffSchema);
