// server/routes/requestRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

// Ensure uploads/images directory exists
const uploadsDir = path.join(__dirname, "../uploads/images");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
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
// Upload images endpoint for quote items
router.post("/upload-images", auth, upload.array("images", 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }
    
    // Return array of image URLs
    const imageUrls = req.files.map(file => {
      // Return relative path that will be served statically
      return `/uploads/images/${file.filename}`;
    });
    
    res.json({ imageUrls });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ error: "Failed to upload images" });
  }
});
router.patch("/:id/items", auth, requireStaff, updateRequestItems);

// General routes (must be last to avoid conflicts)
router.get("/:id", auth, getRequestById);

module.exports = router;

