const express = require("express");
const {
  createTasksFromContract,
  getStaffTasks,
  updateTaskStatus,
  getAllStaff,
  assignStaffToTask
} = require("../controllers/taskController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireStaff } = require("../utils/authMiddleware");

const router = express.Router();

// Manager routes
router.post("/create/:requestId", auth, requireManager, createTasksFromContract);
router.get("/staff", auth, requireManager, getAllStaff);
router.put("/assign/:requestId/:taskId", auth, requireManager, assignStaffToTask);

// Staff routes
router.get("/my-tasks", auth, requireStaff, getStaffTasks);
router.put("/update/:requestId/:taskId", auth, requireStaff, updateTaskStatus);

module.exports = router;
