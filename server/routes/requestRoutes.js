// server/routes/requestRoutes.js
const express = require("express");
const {
  getAllRequests,
  getMyRequests,
  updateRequestStatus,
  createRequest,
  getRequestById,
  getAvailableStaffForRequest,
  assignStaffToRequest
} = require("../controllers/requestController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");

const router = express.Router();

// Manager routes
router.get("/all", auth, requireManager, getAllRequests);
router.put("/:requestId/status", auth, requireManager, updateRequestStatus);
router.get("/:id/available-staff", auth, requireManager, getAvailableStaffForRequest);
router.post("/:id/assign-staff", auth, requireManager, assignStaffToRequest);

// Customer routes
router.get("/my", auth, requireCustomer, getMyRequests);
router.post("/", auth, requireCustomer, createRequest);

// General routes (must be last to avoid conflicts)
router.get("/:id", auth, getRequestById);

module.exports = router;

