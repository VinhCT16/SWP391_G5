const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../utils/authMiddleware");

// Ensure the caller is authenticated and is an admin
router.use(auth);
router.use(auth.requireAdmin);

// Alias routes to support legacy endpoints
// Create account
router.post("/create", adminController.createUser);

// Update account (including role)
router.put("/:userId", adminController.updateUser);

// Delete account
router.delete("/:userId", adminController.deleteUser);

module.exports = router;


