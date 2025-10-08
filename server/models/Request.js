import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  details: [
    {
      detailId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
      description: String,
      quantity: Number
    }
  ],
  contract: {
    contractId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
    signedAt: Date
  },
  tasks: [
    {
      taskId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
      staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      transporterId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      status: { type: String, enum: ["waiting", "in-progress", "completed"], default: "waiting" },
      taskHistory: [
        {
          historyId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
          status: String,
          updatedAt: Date
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
});

export default mongoose.model("Request", requestSchema);
