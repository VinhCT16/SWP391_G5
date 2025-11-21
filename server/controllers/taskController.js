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

// Get all available tasks (for Task List tab - staff can pick)
const getAllAvailableTasks = async (req, res) => {
  try {
    console.log('🔄 [getAllAvailableTasks] Starting...');
    
    // Get all pending tasks that are not assigned (no assignedStaff)
    // Tasks should be pending and not have an assigned staff member
    let tasks;
    try {
      tasks = await Task.find({
        status: 'pending',
        assignedStaff: null
      })
      .populate({
        path: 'requestId',
        select: 'requestId customerId customerName customerPhone moveDetails contractId status createdAt paymentMethod paymentStatus depositPaid',
        populate: {
          path: 'customerId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 })
      .exec();
      
      console.log(`✅ [getAllAvailableTasks] Found ${tasks.length} tasks`);
    } catch (queryErr) {
      console.error('❌ [getAllAvailableTasks] Query error:', queryErr);
      // Try without populate if populate fails
      console.log('🔄 [getAllAvailableTasks] Retrying without populate...');
      tasks = await Task.find({
        status: 'pending',
        assignedStaff: null
      })
      .sort({ createdAt: -1 })
      .exec();
      
      // Manually populate requestId for each task
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].requestId) {
          try {
            const request = await Request.findById(tasks[i].requestId)
              .populate('customerId', 'name email phone')
              .select('requestId customerId customerName customerPhone moveDetails contractId status createdAt paymentMethod paymentStatus depositPaid')
              .lean();
            tasks[i].requestId = request;
          } catch (populateErr) {
            console.error(`❌ [getAllAvailableTasks] Error populating request for task ${tasks[i]._id}:`, populateErr);
            tasks[i].requestId = null;
          }
        }
      }
    }

    // Format tasks with request information
    const formattedTasks = tasks.map(task => {
      try {
        const request = task.requestId;
        // Handle case where request might be null or undefined
        if (!request || !request._id) {
          return {
            _id: task._id,
            taskId: task._id,
            requestId: task.requestId?._id || task.requestId || null,
            requestNumber: 'N/A',
            customer: null,
            request: null,
            taskType: task.taskType,
            status: task.status,
            estimatedDuration: task.estimatedDuration,
            priority: task.priority,
            description: task.description,
            deadline: task.deadline,
            managerNotes: task.managerNotes,
            customerNotes: task.customerNotes,
            attachments: task.attachments || [],
            contractId: null,
            moveDetails: null,
            createdAt: task.createdAt,
            assignedStaff: task.assignedStaff,
            transporter: task.transporter
          };
        }

        const customer = request?.customerId || (request?.customerName ? {
          name: request.customerName,
          email: null,
          phone: request.customerPhone
        } : null);
        
        return {
          _id: task._id,
          taskId: task._id,
          requestId: request?._id,
          requestNumber: request?.requestId || 'N/A',
          customer: customer,
          request: request,
          taskType: task.taskType,
          status: task.status,
          estimatedDuration: task.estimatedDuration,
          priority: task.priority,
          description: task.description,
          deadline: task.deadline,
          managerNotes: task.managerNotes,
          customerNotes: task.customerNotes,
          attachments: task.attachments || [],
          contractId: request?.contractId,
          moveDetails: request?.moveDetails,
          createdAt: task.createdAt,
          assignedStaff: task.assignedStaff,
          transporter: task.transporter
        };
      } catch (mapErr) {
        console.error(`Error formatting task ${task._id}:`, mapErr);
        // Return a minimal task object if formatting fails
        return {
          _id: task._id,
          taskId: task._id,
          requestId: null,
          requestNumber: 'N/A',
          customer: null,
          request: null,
          taskType: task.taskType || 'Unknown',
          status: task.status,
          estimatedDuration: task.estimatedDuration,
          priority: task.priority,
          description: task.description,
          deadline: task.deadline,
          managerNotes: task.managerNotes,
          customerNotes: task.customerNotes,
          attachments: task.attachments || [],
          contractId: null,
          moveDetails: null,
          createdAt: task.createdAt,
          assignedStaff: task.assignedStaff,
          transporter: task.transporter
        };
      }
    });

    res.json({ tasks: formattedTasks });
  } catch (err) {
    console.error("Error fetching available tasks:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all tasks for a staff member (assigned tasks only)
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

    // Map status values: waiting → pending, ongoing → in-progress, done → completed
    let mappedStatus = status;
    if (status === 'waiting') mappedStatus = 'pending';
    else if (status === 'ongoing') mappedStatus = 'in-progress';
    else if (status === 'done') mappedStatus = 'completed';

    // Check task dependencies before allowing status change
    // Dependencies: Packaging → Transporting → Unpackaging
    if (task.taskType === 'Transporting' && (mappedStatus === 'in-progress' || mappedStatus === 'ongoing' || mappedStatus === 'completed' || mappedStatus === 'done')) {
      // Check if Packaging task is completed
      const packagingTask = await Task.findOne({
        requestId: task.requestId,
        taskType: 'Packaging'
      });
      
      if (!packagingTask) {
        return res.status(400).json({ 
          message: "Packaging task not found. Cannot proceed with Transporting task." 
        });
      }
      
      const packagingStatus = packagingTask.status === 'done' ? 'completed' : 
                              packagingTask.status === 'waiting' ? 'pending' :
                              packagingTask.status === 'ongoing' ? 'in-progress' : packagingTask.status;
      
      if (packagingStatus !== 'completed' && (mappedStatus === 'in-progress' || mappedStatus === 'ongoing')) {
        return res.status(400).json({ 
          message: "Cannot start Transporting task. Packaging task must be completed first." 
        });
      }
    }
    
    if (task.taskType === 'Unpackaging' && (mappedStatus === 'in-progress' || mappedStatus === 'ongoing' || mappedStatus === 'completed' || mappedStatus === 'done')) {
      // Check if Transporting task is completed
      const transportingTask = await Task.findOne({
        requestId: task.requestId,
        taskType: 'Transporting'
      });
      
      if (!transportingTask) {
        return res.status(400).json({ 
          message: "Transporting task not found. Cannot proceed with Unpackaging task." 
        });
      }
      
      const transportingStatus = transportingTask.status === 'done' ? 'completed' : 
                                  transportingTask.status === 'waiting' ? 'pending' :
                                  transportingTask.status === 'ongoing' ? 'in-progress' : transportingTask.status;
      
      if (transportingStatus !== 'completed' && (mappedStatus === 'in-progress' || mappedStatus === 'ongoing')) {
        return res.status(400).json({ 
          message: "Cannot start Unpackaging task. Transporting task must be completed first." 
        });
      }
    }

    // Update task status (use mapped status)
    task.status = mappedStatus;
    
    // Add to task history (use original status for display, but store mapped status)
    task.taskHistory.push({
      historyId: new mongoose.Types.ObjectId(),
      status: mappedStatus, // Store mapped status in history
      notes: notes || `Status changed to ${status}`,
      updatedBy: staffId,
      updatedAt: new Date()
    });

    await task.save();

    // Special handling for review tasks: when completed, update request status to UNDER_SURVEY
    if (task.taskType === 'Review' && mappedStatus === 'completed') {
      try {
        const request = await Request.findById(task.requestId);
        if (request) {
          // Update request status to UNDER_SURVEY when staff completes survey
          if (request.status !== 'UNDER_SURVEY') {
            console.log(`[TaskController] Review task ${task._id} completed. Updating request ${request._id} status to UNDER_SURVEY`);
            request.status = 'UNDER_SURVEY';
            await request.save();
            console.log(`[TaskController] Request ${request._id} status updated to UNDER_SURVEY - ready for manager review`);
          }
        }
      } catch (requestErr) {
        // Log error but don't fail the task status update
        console.error('[TaskController] Error updating request status after review task completion:', requestErr);
      }
    }

    // Check if all tasks for this request are completed, then update request status to "Done"
    if (mappedStatus === 'completed' || mappedStatus === 'done') {
      try {
        const request = await Request.findById(task.requestId);
        if (request) {
          // Get all tasks for this request (excluding review tasks)
          const allTasks = await Task.find({
            requestId: request._id,
            taskType: { $in: ['Packaging', 'Transporting', 'Unpackaging'] } // Check all moving tasks
          });

          // Check if all tasks are completed (handle both 'completed' and 'done' statuses)
          const allCompleted = allTasks.length > 0 && allTasks.every(t => {
            const taskStatus = t.status === 'done' ? 'completed' : 
                              t.status === 'waiting' ? 'pending' :
                              t.status === 'ongoing' ? 'in-progress' : t.status;
            return taskStatus === 'completed';
          });

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

// Staff picks a task (assigns themselves)
const pickTask = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.userId;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if task is already assigned
    if (task.assignedStaff) {
      return res.status(400).json({ message: "Task is already assigned to another staff member" });
    }

    // Check if task is completed or cancelled
    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({ message: "Cannot pick a completed or cancelled task" });
    }

    // Find the staff member
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(403).json({ message: "Only staff members can pick tasks" });
    }

    // Get the request to update staff's current tasks
    const request = await Request.findById(task.requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Assign staff to task
    task.assignedStaff = staffId;
    
    // Update task status
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
      notes: `Picked by ${staff.name}`,
      updatedBy: staffId,
      updatedAt: new Date()
    });

    await task.save();

    res.json({
      message: "Task picked successfully",
      task: {
        _id: task._id,
        assignedStaff: task.assignedStaff,
        status: task.status
      }
    });
  } catch (err) {
    console.error("Error picking task:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign staff to task (manager assigns)
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
      notes: `Assigned by manager to ${staff.name}`,
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
  getAllAvailableTasks,
  getStaffTasks,
  updateTaskStatus,
  updateTaskDetails,
  getAllStaff,
  pickTask,
  assignStaffToTask,
  deleteTask
};
