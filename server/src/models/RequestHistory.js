import mongoose from "mongoose";
const schema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "requests", required: true },
  statusChange: {
    type: String,
    enum: ["PENDING","ASSIGNED","IN_PROGRESS","PAUSED","DONE","CANCELED"],
    required: true
  },
  changeDate: { type: Date, default: Date.now },
  notes: String
});
export default mongoose.model("request_history", schema);
