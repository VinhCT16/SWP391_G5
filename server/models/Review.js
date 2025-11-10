const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },   // tên user hoặc id
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" }, // optional: gắn với request
  },
  { timestamps: true } // tự động thêm createdAt, updatedAt
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;