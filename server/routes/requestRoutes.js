const express = require("express");
const {
  createRequest,
  getCustomerRequests,
  getRequestById,
  updateRequestStatus,
  getAllRequests
} = require("../controllers/requestController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");

const router = express.Router();

// Customer routes
router.post("/", auth, requireCustomer, createRequest);
router.get("/my-requests", auth, requireCustomer, getCustomerRequests);
router.get("/:id", auth, getRequestById);

// Manager routes
router.get("/", auth, requireManager, getAllRequests);
router.put("/:id/status", auth, requireManager, updateRequestStatus);

module.exports = router;
