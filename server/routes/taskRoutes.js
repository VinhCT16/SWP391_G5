const express = require("express");
const {
  createTask,
  createTasksFromContract,
  getTaskById,
  getTasksByRequest,
  getStaffTasks,
  updateTaskStatus,
  updateTaskDetails,
  getAllStaff,
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

// Staff routes
router.get("/my-tasks", auth, requireStaff, getStaffTasks);
router.get("/:id", auth, getTaskById);
router.put("/:id/status", auth, requireStaff, updateTaskStatus);
router.put("/:id/details", auth, requireStaff, updateTaskDetails);

// General routes (for getting tasks by request)
router.get("/request/:requestId", auth, getTasksByRequest);

module.exports = router;
