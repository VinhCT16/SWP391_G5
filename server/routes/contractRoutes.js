// server/routes/contractRoutes.js
const express = require("express");
const {
  createContractFromRequest,
  getContractsForApproval,
  approveContract,
  rejectContract,
  getContractsForApproval,
  exportContractPDF,
  assignStaffToContract,
  getAvailableStaff,
  acceptAssignment,
  rejectAssignment,
  getAssignedContracts,
  managerSignContract,
  customerSignContract,
  getAllServices
} = require("../controllers/contractController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");

const router = express.Router();

// Specific routes (must be defined before parameterized routes)
router.get("/", auth, getAllContracts);
router.get("/services", auth, getAllServices);
router.get("/approval", auth, requireManager, getContractsForApproval);
router.post("/approve", auth, requireManager, require("../controllers/contractController").approveAndAssign);
router.post("/from-request/:requestId", auth, requireManager, createContractFromRequest);
router.get("/customer/:customerId", auth, requireCustomer, async (req, res) => {
  try {
    const { customerId } = req.params;
    const contracts = await Contract.find({ customerId })
      .populate({
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('serviceId', 'name price')
      .populate({
        path: 'managerId',
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ createdAt: -1 });
    
    res.json({ contracts });
  } catch (err) {
    console.error("Error fetching customer contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/staff/assigned", auth, requireStaff, getAssignedContracts);

// Parameterized routes (with :id)
// Manager routes
router.put("/:id/status", auth, requireManager, updateContractStatus);
router.put("/:id/approve", auth, requireManager, approveContract);
router.put("/:id/reject", auth, requireManager, rejectContract);
router.put("/:id/sign", auth, requireManager, managerSignContract);
router.post("/:id/assign-staff", auth, requireManager, assignStaffToContract);
router.get("/:id/available-staff", auth, requireManager, getAvailableStaff);

// Customer routes
router.put("/:id/customer-sign", auth, requireCustomer, customerSignContract);

// Staff routes
router.post("/:id/accept-assignment", auth, requireStaff, acceptAssignment);
router.post("/:id/reject-assignment", auth, requireStaff, rejectAssignment);

// PDF Export routes
router.get("/:id/export", auth, exportContractPDF);

// General routes (must be last)
router.get("/:id", auth, getContractById);

module.exports = router;
