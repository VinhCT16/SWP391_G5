const mongoose = require("mongoose");

// Review schema for customer reviews
const reviewSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    // Basic user information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["customer", "manager", "staff", "admin"],
      default: "customer"
    },
    phone: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },

    // Customer-specific fields
    chatHistory: [{
      chatId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
      message: String,
      timestamp: { type: Date, default: Date.now }
    }],
    reviews: [reviewSchema],
    requestHistory: [{
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      status: { type: String, enum: ["pending", "confirmed", "done"], default: "pending" },
      createdAt: { type: Date, default: Date.now }
    }],

    // Manager-specific fields
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true
    },
    department: {
      type: String,
      trim: true
      // enum will be validated in pre-save hook based on role
    },
    managerPermissions: [{
      type: String,
      enum: ["approve_contracts", "manage_staff", "view_reports", "manage_services"]
    }],

    // Staff-specific fields
    staffRole: {
      type: String,
      enum: ["packager", "transporter", "supervisor", "loader", "unloader", "reviewer"]
      // packager: Handles packing and unpacking tasks
      // transporter: Handles transportation tasks
      // supervisor: Can handle all task types (flexible)
      // loader: Specialized in loading tasks
      // unloader: Specialized in unloading tasks
      // reviewer: Specialized in review/survey tasks
    },
    specialization: [{
      type: String,
      enum: ["fragile_items", "heavy_items", "electronics", "furniture", "local_moves", "long_distance"]
    }],
    availability: {
      isAvailable: { type: Boolean, default: true },
      workingHours: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "17:00" }
      },
      workDays: [{
        type: String,
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      }]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    currentTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request"
    }],

    // Admin-specific fields
    adminId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true
    },
    adminPermissions: {
      userManagement: {
        canViewUsers: { type: Boolean, default: true },
        canCreateUsers: { type: Boolean, default: true },
        canUpdateUsers: { type: Boolean, default: true },
        canDeleteUsers: { type: Boolean, default: true },
        canLockUnlockUsers: { type: Boolean, default: true }
      },
      staffManagement: {
        canManageStaff: { type: Boolean, default: true },
        canAssignRoles: { type: Boolean, default: true },
        canViewStaffPerformance: { type: Boolean, default: true }
      },
      systemManagement: {
        canViewSystemLogs: { type: Boolean, default: true },
        canManageSystemSettings: { type: Boolean, default: true }
      }
    },
    lastLogin: {
      type: Date
    },

    // Common fields for employees (manager, staff, admin)
    hireDate: {
      type: Date
    }
  },
  { timestamps: true }
);

// Pre-save validation hook for role-specific fields
// Only validates if the user is being modified (not new) OR if role-specific fields are being set
userSchema.pre('save', function(next) {
  // Skip validation for new customers (they don't need role-specific fields)
  if (this.isNew && this.role === 'customer') {
    return next();
  }

  // For new users with non-customer roles, validate required fields
  // For existing users, only validate if role-specific fields are being modified
  if (this.role === 'manager') {
    // For new managers, always validate. For existing, only if fields are modified
    if (this.isNew || this.isModified('employeeId') || this.isModified('department')) {
      if (this.employeeId === undefined || this.employeeId === null || this.employeeId === '') {
        return next(new Error('Employee ID is required for managers'));
      }
      if (this.department === undefined || this.department === null || this.department === '') {
        return next(new Error('Department is required for managers'));
      }
      const validDepartments = ["Operations", "Customer Service", "Logistics"];
      if (!validDepartments.includes(this.department)) {
        return next(new Error(`Department must be one of: ${validDepartments.join(', ')}`));
      }
    }
  }

  if (this.role === 'staff') {
    // For new staff, always validate. For existing, only if fields are modified
    if (this.isNew || this.isModified('employeeId') || this.isModified('staffRole')) {
      if (this.employeeId === undefined || this.employeeId === null || this.employeeId === '') {
        return next(new Error('Employee ID is required for staff'));
      }
      if (this.staffRole === undefined || this.staffRole === null || this.staffRole === '') {
        return next(new Error('Staff role is required'));
      }
    }
  }

  if (this.role === 'admin') {
    // For new admins, always validate. For existing, only if fields are modified
    if (this.isNew || this.isModified('adminId') || this.isModified('department')) {
      if (this.adminId === undefined || this.adminId === null || this.adminId === '') {
        return next(new Error('Admin ID is required for admins'));
      }
      if (this.department === undefined || this.department === null || this.department === '') {
        return next(new Error('Department is required for admins'));
      }
    }
  }

  next();
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ adminId: 1 }, { sparse: true });
userSchema.index({ 'currentTasks': 1 });

module.exports = mongoose.model("User", userSchema);


