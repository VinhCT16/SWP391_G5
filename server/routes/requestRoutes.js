// server/routes/requestRoutes.js
const express = require("express");
const {
  getAllRequests,
  getMyRequests,
  updateRequestStatus,
  createRequest
} = require("../controllers/requestController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");

const router = express.Router();

// Manager routes
router.get("/all", auth, requireManager, getAllRequests);
router.put("/:requestId/status", auth, requireManager, updateRequestStatus);

// Customer routes
router.get("/my", auth, requireCustomer, getMyRequests);
router.post("/", auth, requireCustomer, createRequest);

module.exports = router;

