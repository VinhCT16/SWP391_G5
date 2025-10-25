const User = require("../models/User");
const Admin = require("../models/Admin");
const Staff = require("../models/Staff");
const Manager = require("../models/Manager");
const Customer = require("../models/Customer");
const Complaint = require("../models/Complaint");
const bcrypt = require("bcrypt");

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional profile information based on role
    let profile = null;
    if (user.role === 'staff') {
      profile = await Staff.findOne({ userId }).select('-userId');
    } else if (user.role === 'manager') {
      profile = await Manager.findOne({ userId }).select('-userId');
    } else if (user.role === 'admin') {
      profile = await Admin.findOne({ userId }).select('-userId');
    }

    res.json({ user, profile });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, additionalData } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: "Name, email, password, and role are required" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || null,
      role
    });

    // Create role-specific profile
    if (role === 'staff' && additionalData) {
      await Staff.create({
        userId: user._id,
        employeeId: additionalData.employeeId,
        role: additionalData.staffRole,
        specialization: additionalData.specialization || [],
        availability: additionalData.availability || {
          isAvailable: true,
          workingHours: { start: "08:00", end: "17:00" },
          workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        }
      });
    } else if (role === 'manager' && additionalData) {
      await Manager.create({
        userId: user._id,
        employeeId: additionalData.employeeId,
        department: additionalData.department,
        permissions: additionalData.permissions || []
      });
    } else if (role === 'admin' && additionalData) {
      await Admin.create({
        userId: user._id,
        adminId: additionalData.adminId,
        department: additionalData.department,
        permissions: additionalData.permissions || {
          userManagement: {
            canViewUsers: true,
            canCreateUsers: true,
            canUpdateUsers: true,
            canDeleteUsers: true,
            canLockUnlockUsers: true
          },
          staffManagement: {
            canManageStaff: true,
            canAssignRoles: true,
            canViewStaffPerformance: true
          },
          systemManagement: {
            canViewSystemLogs: true,
            canManageSystemSettings: true
          }
        }
      });
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive
    };

    res.status(201).json({ 
      message: "User created successfully",
      user: safeUser 
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, role, isActive, additionalData } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic user info
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Update role-specific profile if provided
    if (additionalData) {
      if (user.role === 'staff') {
        await Staff.findOneAndUpdate(
          { userId },
          { $set: additionalData },
          { upsert: true, new: true }
        );
      } else if (user.role === 'manager') {
        await Manager.findOneAndUpdate(
          { userId },
          { $set: additionalData },
          { upsert: true, new: true }
        );
      } else if (user.role === 'admin') {
        await Admin.findOneAndUpdate(
          { userId },
          { $set: additionalData },
          { upsert: true, new: true }
        );
      }
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive
    };

    res.json({ 
      message: "User updated successfully",
      user: safeUser 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lock/Unlock user account
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ 
      message: `User account ${isActive ? 'activated' : 'locked'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete role-specific profile first
    if (user.role === 'staff') {
      await Staff.findOneAndDelete({ userId });
    } else if (user.role === 'manager') {
      await Manager.findOneAndDelete({ userId });
    } else if (user.role === 'admin') {
      await Admin.findOneAndDelete({ userId });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const lockedUsers = await User.countDocuments({ isActive: false });
    
    const roleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      activeUsers,
      lockedUsers,
      roleStats,
      recentUsers
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Customer Management Functions

// Get all customers with pagination and filtering
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object for users with customer role
    const userFilter = { role: 'customer' };
    if (isActive !== undefined) userFilter.isActive = isActive === 'true';
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(userFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get customer profiles for additional info
    const customerIds = customers.map(c => c._id);
    const customerProfiles = await Customer.find({ 
      email: { $in: customers.map(c => c.email) } 
    });

    // Merge user data with customer profile data
    const customersWithProfiles = customers.map(customer => {
      const profile = customerProfiles.find(p => p.email === customer.email);
      return {
        ...customer.toObject(),
        customerProfile: profile || null,
        totalRequests: profile ? profile.requestHistory.length : 0,
        totalReviews: profile ? profile.reviews.length : 0
      };
    });

    const total = await User.countDocuments(userFilter);

    res.json({
      customers: customersWithProfiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCustomers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get customer by ID with full profile
const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const user = await User.findById(customerId).select('-password');
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customerProfile = await Customer.findOne({ email: user.email });
    
    res.json({ 
      customer: user,
      profile: customerProfile,
      totalRequests: customerProfile ? customerProfile.requestHistory.length : 0,
      totalReviews: customerProfile ? customerProfile.reviews.length : 0
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update customer account (lock/unlock, update info)
const updateCustomerAccount = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phone, isActive, reason } = req.body;

    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update basic user info
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Log the action if account is being locked/unlocked
    if (isActive !== undefined) {
      console.log(`Customer ${user.email} account ${isActive ? 'activated' : 'locked'} by admin. Reason: ${reason || 'No reason provided'}`);
    }

    res.json({ 
      message: `Customer account ${isActive !== undefined ? (isActive ? 'activated' : 'locked') : 'updated'} successfully`,
      customer: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Error updating customer account:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get customer complaints/support requests
const getCustomerComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId, priority, category } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComplaints: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Handle customer complaint/support request
const handleCustomerComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { action, response, status, adminNotes, priority } = req.body;
    const adminId = req.user.id; // From auth middleware

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Get admin info
    const admin = await User.findById(adminId).select('name');

    // Update complaint based on action
    if (action === 'respond') {
      complaint.adminResponse = {
        response,
        adminId,
        adminName: admin.name,
        respondedAt: new Date()
      };
      if (status) complaint.status = status;
    } else if (action === 'resolve') {
      complaint.status = 'resolved';
      complaint.resolution = {
        resolution: response,
        resolvedAt: new Date(),
        adminId
      };
    } else if (action === 'close') {
      complaint.status = 'closed';
    } else if (action === 'update') {
      if (status) complaint.status = status;
      if (priority) complaint.priority = priority;
    }

    if (adminNotes) complaint.adminNotes = adminNotes;

    await complaint.save();

    res.json({ 
      message: "Complaint handled successfully",
      complaint: {
        id: complaint._id,
        status: complaint.status,
        priority: complaint.priority,
        adminResponse: complaint.adminResponse,
        adminNotes: complaint.adminNotes,
        updatedAt: complaint.updatedAt
      }
    });
  } catch (error) {
    console.error("Error handling complaint:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all complaints (admin view)
const getAllComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComplaints: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get complaint statistics
const getComplaintStats = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const closedComplaints = await Complaint.countDocuments({ status: 'closed' });

    const priorityStats = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const recentComplaints = await Complaint.find()
      .populate('customerId', 'name email')
      .select('subject status priority createdAt customerId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
      priorityStats,
      categoryStats,
      recentComplaints
    });
  } catch (error) {
    console.error("Error fetching complaint stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const lockedCustomers = await User.countDocuments({ role: 'customer', isActive: false });
    
    const recentCustomers = await User.find({ role: 'customer' })
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get customer activity stats
    const customerProfiles = await Customer.find();
    const totalReviews = customerProfiles.reduce((sum, profile) => sum + profile.reviews.length, 0);
    const totalRequests = customerProfiles.reduce((sum, profile) => sum + profile.requestHistory.length, 0);

    res.json({
      totalCustomers,
      activeCustomers,
      lockedCustomers,
      recentCustomers,
      totalReviews,
      totalRequests
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats,
  resetUserPassword,
  // Customer management
  getAllCustomers,
  getCustomerById,
  updateCustomerAccount,
  getCustomerComplaints,
  handleCustomerComplaint,
  getCustomerStats,
  // Complaint management
  getAllComplaints,
  getComplaintStats
};
