const Request = require("../models/Request");
const Staff = require("../models/Staff");
const { v4: uuidv4 } = require('uuid');

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

    // Check if tasks already exist
    if (request.tasks && request.tasks.length > 0) {
      return res.status(409).json({ message: "Tasks already exist for this request" });
    }

    // Create tasks
    const createdTasks = tasks.map(taskData => ({
      taskId: uuidv4(),
      taskType: taskData.taskType,
      assignedStaff: taskData.assignedStaff || null,
      transporter: taskData.transporter || null,
      estimatedDuration: taskData.estimatedDuration || 2,
      status: 'pending'
    }));

    request.tasks = createdTasks;
    request.status = 'in_progress';
    await request.save();

    // Update staff current tasks
    for (const task of createdTasks) {
      if (task.assignedStaff) {
        await Staff.findByIdAndUpdate(task.assignedStaff, {
          $addToSet: { currentTasks: request._id }
        });
      }
      if (task.transporter) {
        await Staff.findByIdAndUpdate(task.transporter, {
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
    res.status(500).json({ message: "Server error" });
  }
};

// Get all tasks for a staff member
const getStaffTasks = async (req, res) => {
  try {
    const staffId = req.userId;
    
    // Find staff member
    const staff = await Staff.findOne({ userId: staffId });
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Get requests with tasks assigned to this staff
    const requests = await Request.find({
      'tasks.assignedStaff': staff._id
    }).populate('customerId', 'name email phone');

    // Get requests where this staff is transporter
    const transportRequests = await Request.find({
      'tasks.transporter': staff._id
    }).populate('customerId', 'name email phone');

    // Combine and format tasks
    const allTasks = [];
    
    requests.forEach(request => {
      request.tasks.forEach(task => {
        if (task.assignedStaff && task.assignedStaff.toString() === staff._id.toString()) {
          allTasks.push({
            taskId: task.taskId,
            requestId: request._id,
            requestNumber: request.requestId,
            customer: request.customerId,
            taskType: task.taskType,
            status: task.status,
            estimatedDuration: task.estimatedDuration,
            moveDetails: request.moveDetails,
            createdAt: request.createdAt
          });
        }
      });
    });

    transportRequests.forEach(request => {
      request.tasks.forEach(task => {
        if (task.transporter && task.transporter.toString() === staff._id.toString()) {
          allTasks.push({
            taskId: task.taskId,
            requestId: request._id,
            requestNumber: request.requestId,
            customer: request.customerId,
            taskType: task.taskType,
            status: task.status,
            estimatedDuration: task.estimatedDuration,
            moveDetails: request.moveDetails,
            createdAt: request.createdAt,
            isTransporter: true
          });
        }
      });
    });

    res.json({ tasks: allTasks });
  } catch (err) {
    console.error("Error fetching staff tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { requestId, taskId } = req.params;
    const { status, notes } = req.body;
    const staffId = req.userId;

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Find the specific task
    const task = request.tasks.find(t => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if staff is assigned to this task
    const staff = await Staff.findOne({ userId: staffId });
    if (!staff) {
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
      historyId: uuidv4(),
      status: status,
      notes: notes || '',
      updatedBy: staffId,
      updatedAt: new Date()
    });

    await request.save();

    res.json({
      message: "Task status updated successfully",
      task: {
        taskId: task.taskId,
        status: task.status,
        updatedAt: new Date()
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
    const staff = await Staff.find({ isActive: true })
      .populate('userId', 'name email')
      .select('employeeId role specialization availability rating');

    res.json({ staff });
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign staff to task
const assignStaffToTask = async (req, res) => {
  try {
    const { requestId, taskId } = req.params;
    const { staffId, role } = req.body; // role: 'assignedStaff' or 'transporter'

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Find the specific task
    const task = request.tasks.find(t => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Assign staff to task
    if (role === 'assignedStaff') {
      task.assignedStaff = staffId;
    } else if (role === 'transporter') {
      task.transporter = staffId;
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Add to staff's current tasks
    await Staff.findByIdAndUpdate(staffId, {
      $addToSet: { currentTasks: request._id }
    });

    // Add to task history
    task.taskHistory.push({
      historyId: uuidv4(),
      status: 'assigned',
      notes: `Assigned to ${staff.role}`,
      updatedBy: req.userId,
      updatedAt: new Date()
    });

    await request.save();

    res.json({
      message: "Staff assigned to task successfully",
      task: {
        taskId: task.taskId,
        assignedStaff: task.assignedStaff,
        transporter: task.transporter
      }
    });
  } catch (err) {
    console.error("Error assigning staff to task:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTasksFromContract,
  getStaffTasks,
  updateTaskStatus,
  getAllStaff,
  assignStaffToTask
};
