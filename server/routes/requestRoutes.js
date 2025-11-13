// server/routes/requestRoutes.js
const express = require("express");
const multer = require("multer");
const {
  getAllRequests,
  getMyRequests,
  updateRequestStatus,
  createRequest,
  getRequestById,
  getAvailableStaffForRequest,
  assignStaffToRequest,
  getStaffTasks,
  updateRequest,
  cancelRequest,
  updateRequestItems
} = require("../controllers/requestController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer, requireStaff } = require("../utils/authMiddleware");

const router = express.Router();

// Configure multer for handling file uploads (in memory for now)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Manager routes
router.get("/all", auth, requireManager, getAllRequests);
router.put("/:requestId/status", auth, requireManager, updateRequestStatus);
router.get("/:id/available-staff", auth, requireManager, getAvailableStaffForRequest);
router.post("/:id/assign-staff", auth, requireManager, assignStaffToRequest);

// Customer routes
router.get("/my", auth, requireCustomer, getMyRequests);
// Handle both JSON and FormData (with optional file uploads)
router.post("/", auth, requireCustomer, upload.array("images", 4), createRequest);
// Update request (customers can edit their own requests)
router.patch("/:id", auth, requireCustomer, updateRequest);
// Cancel request (customers can cancel their own requests)
router.post("/:id/cancel", auth, requireCustomer, cancelRequest);

// Staff routes (must be before /:id to avoid conflicts)
router.get("/staff/tasks", auth, requireStaff, getStaffTasks);
router.patch("/:id/items", auth, requireStaff, updateRequestItems);

// General routes (must be last to avoid conflicts)
router.get("/:id", auth, getRequestById);

module.exports = router;

