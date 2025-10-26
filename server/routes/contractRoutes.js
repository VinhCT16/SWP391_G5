const express = require("express");
const {
  createContractFromRequest,
  getContractById,
  updateContractStatus,
  getAllContracts,
  approveContract,
  rejectContract,
  getContractsForApproval,
  exportContractPDF
} = require("../controllers/contractController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");
const Contract = require("../models/Contract");

const router = express.Router();

// Manager routes
router.post("/from-request/:requestId", auth, requireManager, createContractFromRequest);
router.get("/", auth, requireManager, getAllContracts);
router.get("/approval", auth, requireManager, getContractsForApproval);
router.put("/:id/status", auth, requireManager, updateContractStatus);
router.put("/:id/approve", auth, requireManager, approveContract);
router.put("/:id/reject", auth, requireManager, rejectContract);

// Customer routes
router.get("/customer/:customerId", auth, requireCustomer, async (req, res) => {
  try {
    const { customerId } = req.params;
    const contracts = await Contract.find({ customerId })
      .populate('serviceId', 'name price')
      .populate('managerId', 'userId')
      .sort({ createdAt: -1 });
    
    res.json({ contracts });
  } catch (err) {
    console.error("Error fetching customer contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PDF Export routes
router.get("/:id/export", auth, exportContractPDF);

// General routes
router.get("/:id", auth, getContractById);

module.exports = router;
