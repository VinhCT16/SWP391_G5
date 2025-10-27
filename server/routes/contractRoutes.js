const express = require("express");
const {
  createContractFromRequest,
  getContractById,
  updateContractStatus,
  getAllContracts,
  approveContract,
  rejectContract,
  getContractsForApproval,
  exportContractPDF,
  assignStaffToContract,
  getAvailableStaff,
  acceptAssignment,
  rejectAssignment,
  getAssignedContracts
} = require("../controllers/contractController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer, requireStaff } = require("../utils/authMiddleware");
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

// Staff assignment routes (Manager)
router.post("/:id/assign-staff", auth, requireManager, assignStaffToContract);
router.get("/:id/available-staff", auth, requireManager, getAvailableStaff);

// Staff routes
router.get("/staff/assigned", auth, requireStaff, getAssignedContracts);
router.post("/:id/accept-assignment", auth, requireStaff, acceptAssignment);
router.post("/:id/reject-assignment", auth, requireStaff, rejectAssignment);

// PDF Export routes
router.get("/:id/export", auth, exportContractPDF);

// General routes
router.get("/:id", auth, getContractById);

module.exports = router;
