const express = require("express");
const {
  createContractFromRequest,
  getContractById,
  updateContractStatus,
  getAllContracts
} = require("../controllers/contractController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireCustomer } = require("../utils/authMiddleware");

const router = express.Router();

// Manager routes
router.post("/from-request/:requestId", auth, requireManager, createContractFromRequest);
router.get("/", auth, requireManager, getAllContracts);
router.put("/:id/status", auth, requireManager, updateContractStatus);

// General routes
router.get("/:id", auth, getContractById);

module.exports = router;
