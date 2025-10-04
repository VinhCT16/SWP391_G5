import express from "express";
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// 📌 Routes cho CRUD
router.get("/", getReviews);          // GET /reviews
router.get("/:id", getReviewById);    // GET /reviews/:id
router.post("/", createReview);       // POST /reviews
router.put("/:id", updateReview);     // PUT /reviews/:id
router.delete("/:id", deleteReview);  // DELETE /reviews/:id

export default router;
