const express = require("express");
const {
  createTask,
  createTasksFromContract,
  getTaskById,
  getTasksByRequest,
  getAllAvailableTasks,
  getStaffTasks,
  updateTaskStatus,
  updateTaskDetails,
  getAllStaff,
  pickTask,
  assignStaffToTask,
  deleteTask
} = require("../controllers/taskController");
const auth = require("../utils/authMiddleware");
const { requireManager, requireStaff } = require("../utils/authMiddleware");

const router = express.Router();

// Manager routes
router.post("/", auth, requireManager, createTask);
router.post("/create/:requestId", auth, requireManager, createTasksFromContract);
router.get("/staff", auth, requireManager, getAllStaff);
router.put("/:id/assign", auth, requireManager, assignStaffToTask);
router.delete("/:id", auth, requireManager, deleteTask);

// Staff routes - IMPORTANT: Specific routes must come before parameterized routes
router.get("/available", auth, requireStaff, getAllAvailableTasks); // Get all available tasks
router.get("/my-tasks", auth, requireStaff, getStaffTasks); // Get assigned tasks
router.get("/request/:requestId", auth, getTasksByRequest); // Get tasks by request (must come before /:id)
router.put("/:id/pick", auth, requireStaff, pickTask); // Staff picks a task
router.put("/:id/status", auth, requireStaff, updateTaskStatus);
router.put("/:id/details", auth, requireStaff, updateTaskDetails);
router.get("/:id", auth, getTaskById); // This must be last to avoid matching "available" or "my-tasks"

module.exports = router;
