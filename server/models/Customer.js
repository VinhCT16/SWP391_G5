const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  chatHistory: [
    {
      chatId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
      message: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  reviews: [reviewSchema],
  requestHistory: [
    {
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      status: { type: String, enum: ["pending", "confirmed", "done"], default: "pending" },
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Customer", customerSchema);
