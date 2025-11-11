// server/controllers/reviewController.js
const Review = require("../models/Review");

// Get all reviews
const getReviews = async (req, res) => {
  try {
    const { requestId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (requestId) {
      filter.requestId = requestId;
    }

    const reviews = await Review.find(filter)
      .populate('requestId', 'requestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get review by ID
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id)
      .populate('requestId', 'requestId');

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ review });
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new review
const createReview = async (req, res) => {
  try {
    const { user, rating, comment, requestId } = req.body;

    // Validation
    if (!user || !rating || !comment) {
      return res.status(400).json({ message: "User, rating, and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({
      user,
      rating,
      comment,
      requestId: requestId || undefined
    });

    res.status(201).json({
      message: "Review created successfully",
      review
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update fields if provided
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    res.json({
      message: "Review updated successfully",
      review
    });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({
      message: "Review deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};

