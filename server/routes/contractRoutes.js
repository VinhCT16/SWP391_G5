// server/routes/contractRoutes.js
const express = require("express");
const {
  createContractFromRequest,
  getContractsForApproval,
  approveContract,
  rejectContract,
  getCustomerContracts,
  getContractProgress
} = require("../controllers/contractController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");

const router = express.Router();

// Manager routes
router.post("/from-request/:requestId", auth, requireManager, createContractFromRequest);
// Role-based listing is handled in controller; allow all authenticated users
router.get("/", auth, getAllContracts);
router.get("/approval", auth, requireManager, getContractsForApproval);
router.put("/:id/status", auth, requireManager, updateContractStatus);
router.put("/:id/approve", auth, requireManager, approveContract);
router.put("/:id/reject", auth, requireManager, rejectContract);
// New combined approval endpoint (POST /contracts/approve)
router.post("/approve", auth, requireManager, require("../controllers/contractController").approveAndAssign);
router.get("/approval", auth, requireManager, getContractsForApproval);
router.put("/:contractId/approve", auth, requireManager, approveContract);
router.put("/:contractId/reject", auth, requireManager, rejectContract);

// Customer routes
router.get("/customer", auth, requireCustomer, getCustomerContracts);
router.get("/:contractId/progress", auth, requireCustomer, getContractProgress);

module.exports = router;