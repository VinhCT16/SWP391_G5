const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    adminId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    permissions: {
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
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  { timestamps: true }
);

// Index for better query performance
adminSchema.index({ userId: 1 });
adminSchema.index({ adminId: 1 });

module.exports = mongoose.model("Admin", adminSchema);
