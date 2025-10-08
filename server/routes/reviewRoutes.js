const express = require("express");
const {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

// 📌 Routes cho CRUD
router.get("/", getReviews);          // GET /reviews
router.get("/:id", getReviewById);    // GET /reviews/:id
router.post("/", createReview);       // POST /reviews
router.put("/:id", updateReview);     // PUT /reviews/:id
router.delete("/:id", deleteReview);  // DELETE /reviews/:id

module.exports = router;
