const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../utils/authMiddleware");

// Ensure base auth runs first to populate req.userId, then enforce admin role
router.use(auth);
router.use(auth.requireAdmin);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/users/stats", adminController.getUserStats);
router.get("/users/:userId", adminController.getUserById);
router.post("/users", adminController.createUser);
router.put("/users/:userId", adminController.updateUser);
router.put("/users/:userId/toggle-status", adminController.toggleUserStatus);
router.put("/users/:userId/reset-password", adminController.resetUserPassword);
router.delete("/users/:userId", adminController.deleteUser);

// Customer management routes
router.get("/customers", adminController.getAllCustomers);
router.get("/customers/stats", adminController.getCustomerStats); // Must be before /customers/:customerId
router.get("/customers/:customerId/complaints", adminController.getCustomerComplaints); // Must be before /customers/:customerId
router.get("/customers/:customerId", adminController.getCustomerById);
router.put("/customers/:customerId", adminController.updateCustomerAccount);

// Complaint management routes
router.get("/complaints", adminController.getAllComplaints);
router.get("/complaints/stats", adminController.getComplaintStats);
router.put("/complaints/:complaintId", adminController.handleCustomerComplaint);

module.exports = router;
