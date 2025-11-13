const Task = require("../models/Task");
const Request = require("../models/Request");
const User = require("../models/User");
const mongoose = require('mongoose');
const { validateStaffAssignment, canStaffHandleTask } = require("../utils/staffAssignment");

// Create tasks from approved contract
const createTasksFromContract = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { tasks } = req.body;

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if request has a contract
    if (!request.contractId) {
      return res.status(400).json({ message: "Request must have a contract before creating tasks" });
    }

    // Check if tasks already exist for this request
    const existingTasks = await Task.find({ requestId: request._id });
    if (existingTasks.length > 0) {
      return res.status(409).json({ message: "Tasks already exist for this request" });
    }

    // Create tasks
    const createdTasks = await Task.insertMany(
      tasks.map(taskData => ({
        requestId: request._id,
        taskType: taskData.taskType,
        assignedStaff: taskData.assignedStaff || null,
        transporter: taskData.transporter || null,
        estimatedDuration: taskData.estimatedDuration || 2,
        priority: taskData.priority || 'medium',
        description: taskData.description || '',
        deadline: taskData.deadline || null,
        managerNotes: taskData.managerNotes || '',
        customerNotes: taskData.customerNotes || '',
        attachments: taskData.attachments || [],
        status: 'pending'
      }))
    );

    // Update request status
    request.status = 'in_progress';
    await request.save();

    // Update staff current tasks
    for (const task of createdTasks) {
      if (task.assignedStaff) {
        await User.findByIdAndUpdate(task.assignedStaff, {
          $addToSet: { currentTasks: request._id }
        });
      }
      if (task.transporter) {
        await User.findByIdAndUpdate(task.transporter, {
          $addToSet: { currentTasks: request._id }
        });
      }
    }

    res.status(201).json({
      message: "Tasks created successfully",
      tasks: createdTasks,
      requestId: request._id
    });
  } catch (err) {
    console.error("Error creating tasks:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all tasks for a staff member
const getStaffTasks = async (req, res) => {
  try {
    const staffId = req.userId;
    
    // Find staff user
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Get tasks assigned to this staff (as assignedStaff or transporter)
    const tasks = await Task.find({
      $or: [
        { assignedStaff: staff._id },
        { transporter: staff._id }
      ]
    })
    .populate({
      path: 'requestId',
      select: 'requestId customerId customerName customerPhone moveDetails contractId status createdAt',
      populate: {
        path: 'customerId',
        select: 'name email phone'
      }
    })
    .sort({ createdAt: -1 });

    // Format tasks with request information
    const formattedTasks = tasks.map(task => {
      const request = task.requestId;
      // Get customer from populated customerId or use top-level customerName/customerPhone
      const customer = request?.customerId || (request?.customerName ? {
        name: request.customerName,
        email: null,
        phone: request.customerPhone
      } : null);
      
      return {
        _id: task._id,
        taskId: task._id, // For backward compatibility
        requestId: request?._id,
        requestNumber: request?.requestId,
        customer: customer,
        request: request, // Include full request object for fallback
        taskType: task.taskType,
        status: task.status,
        estimatedDuration: task.estimatedDuration,
        priority: task.priority,
        description: task.description,
        deadline: task.deadline,
        managerNotes: task.managerNotes,
        customerNotes: task.customerNotes,
        attachments: task.attachments,
        contractId: request?.contractId,
        moveDetails: request?.moveDetails,
        createdAt: task.createdAt,
        assignedStaff: task.assignedStaff,
        transporter: task.transporter,
        isTransporter: task.transporter?.toString() === staff._id.toString()
      };
    });

    res.json({ tasks: formattedTasks });
  } catch (err) {
    console.error("Error fetching staff tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id)
      .populate('requestId', 'requestId customerId moveDetails contractId')
      .populate('assignedStaff', 'name email phone')
      .populate('transporter', 'name email phone')
      .populate('requestId.customerId', 'name email phone');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task });
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all tasks for a request
const getTasksByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const tasks = await Task.find({ requestId: request._id })
      .populate('assignedStaff', 'name email phone')
      .populate('transporter', 'name email phone')
      .sort({ createdAt: 1 });

    res.json({ tasks });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const staffId = req.userId;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if staff is assigned to this task
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const isAssigned = task.assignedStaff && task.assignedStaff.toString() === staff._id.toString();
    const isTransporter = task.transporter && task.transporter.toString() === staff._id.toString();

    if (!isAssigned && !isTransporter) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    // Update task status
    task.status = status;
    
    // Add to task history
    task.taskHistory.push({
      historyId: new mongoose.Types.ObjectId(),
      status: status,
      notes: notes || '',
      updatedBy: staffId,
      updatedAt: new Date()
    });

    await task.save();

    // Special handling for review tasks: when completed, update request status
    if (task.taskType === 'review' && status === 'completed') {
      try {
        const request = await Request.findById(task.requestId);
        if (request && request.status === 'UNDER_SURVEY') {
          console.log(`[TaskController] Review task ${task._id} completed. Updating request ${request._id} status from UNDER_SURVEY to PENDING`);
          request.status = 'PENDING';
          await request.save();
          console.log(`[TaskController] Request ${request._id} status updated to PENDING - ready for manager approval`);
        }
      } catch (requestErr) {
        // Log error but don't fail the task status update
        console.error('[TaskController] Error updating request status after review task completion:', requestErr);
      }
    }

    // Check if all tasks for this request are completed, then update request status to "Done"
    if (status === 'completed') {
      try {
        const request = await Request.findById(task.requestId);
        if (request) {
          // Get all tasks for this request (excluding review tasks)
          const allTasks = await Task.find({
            requestId: request._id,
            taskType: { $in: ['packing', 'transporting'] } // Only check packing and transporting tasks
          });

          // Check if all tasks are completed
          const allCompleted = allTasks.length > 0 && allTasks.every(t => t.status === 'completed');

          if (allCompleted && request.status !== 'DONE' && request.status !== 'completed') {
            console.log(`[TaskController] All tasks completed for request ${request._id}. Updating status to DONE`);
            request.status = 'DONE';
            await request.save();
            console.log(`[TaskController] Request ${request._id} status updated to DONE`);
          }
        }
      } catch (requestErr) {
        // Log error but don't fail the task status update
        console.error('[TaskController] Error checking/updating request status after task completion:', requestErr);
      }
    }

    res.json({
      message: "Task status updated successfully",
      task: {
        _id: task._id,
        status: task.status,
        updatedAt: task.updatedAt
      }
    });
  } catch (err) {
    console.error("Error updating task status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all staff members
const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff', isActive: true })
      .select('name email phone employeeId staffRole specialization availability rating');

    res.json({ staff });
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign staff to task
const assignStaffToTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, role } = req.body; // role: 'assignedStaff' or 'transporter'

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Find the staff member
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Role validation temporarily disabled - any staff can handle any task
    // if (!canStaffHandleTask(staff.staffRole, task.taskType)) {
    //   return res.status(400).json({ 
    //     message: `Staff with role '${staff.staffRole}' cannot be assigned to '${task.taskType}' tasks. Compatible roles required.` 
    //   });
    // }

    // Get the request to update staff's current tasks
    const request = await Request.findById(task.requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Assign staff to task
    if (role === 'assignedStaff') {
      task.assignedStaff = staffId;
    } else if (role === 'transporter') {
      task.transporter = staffId;
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Update task status if it was pending
    if (task.status === 'pending') {
      task.status = 'assigned';
    }

    // Add to staff's current tasks
    await User.findByIdAndUpdate(staffId, {
      $addToSet: { currentTasks: request._id }
    });

    // Add to task history
    task.taskHistory.push({
      historyId: new mongoose.Types.ObjectId(),
      status: 'assigned',
      notes: `Assigned to ${staff.staffRole}`,
      updatedBy: req.userId,
      updatedAt: new Date()
    });

    await task.save();

    res.json({
      message: "Staff assigned to task successfully",
      task: {
        _id: task._id,
        assignedStaff: task.assignedStaff,
        transporter: task.transporter
      }
    });
  } catch (err) {
    console.error("Error assigning staff to task:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update task details (priority, description, deadline, notes)
const updateTaskDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, description, deadline, managerNotes, customerNotes } = req.body;
    const staffId = req.userId;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if staff is assigned to this task
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const isAssigned = task.assignedStaff && task.assignedStaff.toString() === staff._id.toString();
    const isTransporter = task.transporter && task.transporter.toString() === staff._id.toString();

    if (!isAssigned && !isTransporter) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    // Update task details
    if (priority !== undefined) task.priority = priority;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline;
    if (managerNotes !== undefined) task.managerNotes = managerNotes;
    if (customerNotes !== undefined) task.customerNotes = customerNotes;

    await task.save();

    res.json({
      message: "Task details updated successfully",
      task: {
        _id: task._id,
        priority: task.priority,
        description: task.description,
        deadline: task.deadline,
        managerNotes: task.managerNotes,
        customerNotes: task.customerNotes
      }
    });
  } catch (err) {
    console.error("Error updating task details:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a single task
const createTask = async (req, res) => {
  try {
    const { requestId, taskType, assignedStaff, transporter, estimatedDuration, priority, description, deadline } = req.body;

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Create task
    const task = await Task.create({
      requestId: request._id,
      taskType,
      assignedStaff: assignedStaff || null,
      transporter: transporter || null,
      estimatedDuration: estimatedDuration || 2,
      priority: priority || 'medium',
      description: description || '',
      deadline: deadline || null,
      status: assignedStaff || transporter ? 'assigned' : 'pending'
    });

    // Update staff current tasks if assigned
    if (task.assignedStaff) {
      await User.findByIdAndUpdate(task.assignedStaff, {
        $addToSet: { currentTasks: request._id }
      });
    }
    if (task.transporter) {
      await User.findByIdAndUpdate(task.transporter, {
        $addToSet: { currentTasks: request._id }
      });
    }

    res.status(201).json({
      message: "Task created successfully",
      task
    });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Get the request to update staff's current tasks
    const request = await Request.findById(task.requestId);
    
    // Remove from staff's current tasks
    if (task.assignedStaff && request) {
      await User.findByIdAndUpdate(task.assignedStaff, {
        $pull: { currentTasks: request._id }
      });
    }
    if (task.transporter && request) {
      await User.findByIdAndUpdate(task.transporter, {
        $pull: { currentTasks: request._id }
      });
    }

    await Task.findByIdAndDelete(id);

    res.json({
      message: "Task deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
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
};
