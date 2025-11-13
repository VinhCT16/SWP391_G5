// server/utils/staffAssignment.js
// Utility functions for staff role-based task assignment

const User = require("../models/User");
const Task = require("../models/Task");

/**
 * Mapping between task types and required staff roles
 * Some tasks can be done by multiple roles (flexible assignment)
 * Order matters: first role is preferred, but others can also handle it
 */
const TASK_TYPE_TO_STAFF_ROLE = {
  'packing': ['packager', 'supervisor'], // Packagers or supervisors can pack
  'loading': ['loader', 'packager', 'transporter', 'supervisor'], // Specialized loaders preferred
  'transporting': ['transporter', 'supervisor'], // Only transporters or supervisors
  'unloading': ['unloader', 'packager', 'transporter', 'supervisor'], // Specialized unloaders preferred
  'unpacking': ['packager', 'supervisor'], // Packagers or supervisors can unpack
  'review': ['reviewer', 'supervisor', 'packager'] // Specialized reviewers preferred, then supervisors
};

/**
 * Get the primary required role for a task type
 */
const getPrimaryRoleForTask = (taskType) => {
  const roles = TASK_TYPE_TO_STAFF_ROLE[taskType];
  return roles ? roles[0] : null; // Return first role as primary
};

/**
 * Get all compatible roles for a task type
 */
const getCompatibleRolesForTask = (taskType) => {
  return TASK_TYPE_TO_STAFF_ROLE[taskType] || [];
};

/**
 * Check if a staff member can be assigned to a task based on their role
 */
const canStaffHandleTask = (staffRole, taskType) => {
  const compatibleRoles = getCompatibleRolesForTask(taskType);
  return compatibleRoles.includes(staffRole);
};

/**
 * Find available staff members for a specific task type
 * Filters by:
 * 1. Active status
 * 2. Availability
 * 3. Staff role compatibility with task type
 * 4. Current task load (for load balancing)
 */
const findAvailableStaffForTask = async (taskType, options = {}) => {
  try {
    const {
      excludeStaffIds = [],
      minRating = 0,
      maxCurrentTasks = null,
      preferredSpecializations = []
    } = options;

    // Get compatible roles for this task
    const compatibleRoles = getCompatibleRolesForTask(taskType);
    
    if (compatibleRoles.length === 0) {
      console.warn(`[findAvailableStaffForTask] No compatible roles found for taskType: ${taskType}`);
      return [];
    }

    // Build query for available staff
    const query = {
      role: 'staff',
      isActive: true,
      staffRole: { $in: compatibleRoles },
      'availability.isAvailable': true
    };

    // Exclude specific staff if needed
    if (excludeStaffIds.length > 0) {
      query._id = { $nin: excludeStaffIds };
    }

    // Find staff matching criteria
    let availableStaff = await User.find(query)
      .select('name email phone employeeId staffRole specialization availability rating currentTasks')
      .lean();

    // Filter by rating if specified
    if (minRating > 0) {
      availableStaff = availableStaff.filter(staff => (staff.rating || 0) >= minRating);
    }

    // Filter by specialization if specified
    if (preferredSpecializations.length > 0) {
      availableStaff = availableStaff.filter(staff => {
        const staffSpecializations = staff.specialization || [];
        return preferredSpecializations.some(spec => staffSpecializations.includes(spec));
      });
    }

    // Calculate current task load for each staff
    const staffWithLoad = await Promise.all(
      availableStaff.map(async (staff) => {
        // Count active tasks (not completed or cancelled)
        const activeTaskCount = await Task.countDocuments({
          $or: [
            { assignedStaff: staff._id },
            { transporter: staff._id }
          ],
          status: { $nin: ['completed', 'cancelled'] }
        });

        return {
          ...staff,
          currentTaskCount: activeTaskCount,
          currentTasksArray: staff.currentTasks || []
        };
      })
    );

    // Filter by max current tasks if specified
    let filteredStaff = staffWithLoad;
    if (maxCurrentTasks !== null) {
      filteredStaff = staffWithLoad.filter(staff => staff.currentTaskCount <= maxCurrentTasks);
    }

    // Sort by current task count (load balancing) and rating
    filteredStaff.sort((a, b) => {
      // First sort by task count (fewer tasks = higher priority)
      if (a.currentTaskCount !== b.currentTaskCount) {
        return a.currentTaskCount - b.currentTaskCount;
      }
      // Then by rating (higher rating = higher priority)
      return (b.rating || 0) - (a.rating || 0);
    });

    return filteredStaff;
  } catch (error) {
    console.error('[findAvailableStaffForTask] Error:', error);
    return [];
  }
};

/**
 * Auto-assign the best available staff member to a task
 * Returns the selected staff member or null if none available
 */
const autoAssignStaffToTask = async (taskType, options = {}) => {
  try {
    const availableStaff = await findAvailableStaffForTask(taskType, options);
    
    if (availableStaff.length === 0) {
      console.warn(`[autoAssignStaffToTask] No available staff found for taskType: ${taskType}`);
      return null;
    }

    // Return the best candidate (first in sorted list)
    const selectedStaff = availableStaff[0];
    console.log(`[autoAssignStaffToTask] Selected staff for ${taskType}:`, {
      staffId: selectedStaff._id,
      name: selectedStaff.name,
      role: selectedStaff.staffRole,
      currentTaskCount: selectedStaff.currentTaskCount,
      rating: selectedStaff.rating
    });

    return selectedStaff;
  } catch (error) {
    console.error('[autoAssignStaffToTask] Error:', error);
    return null;
  }
};

/**
 * Validate if a staff member can be assigned to a task
 */
const validateStaffAssignment = async (staffId, taskType) => {
  try {
    const staff = await User.findById(staffId);
    
    if (!staff || staff.role !== 'staff' || !staff.isActive) {
      return { valid: false, reason: 'Staff not found or inactive' };
    }

    if (!canStaffHandleTask(staff.staffRole, taskType)) {
      return {
        valid: false,
        reason: `Staff role '${staff.staffRole}' cannot handle task type '${taskType}'`
      };
    }

    if (!staff.availability?.isAvailable) {
      return { valid: false, reason: 'Staff is not available' };
    }

    return { valid: true };
  } catch (error) {
    console.error('[validateStaffAssignment] Error:', error);
    return { valid: false, reason: 'Error validating assignment' };
  }
};

/**
 * Get staff statistics by role
 */
const getStaffStatsByRole = async () => {
  try {
    const staffByRole = await User.aggregate([
      {
        $match: {
          role: 'staff',
          isActive: true
        }
      },
      {
        $group: {
          _id: '$staffRole',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          available: {
            $sum: {
              $cond: [{ $eq: ['$availability.isAvailable', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    return staffByRole;
  } catch (error) {
    console.error('[getStaffStatsByRole] Error:', error);
    return [];
  }
};

module.exports = {
  TASK_TYPE_TO_STAFF_ROLE,
  getPrimaryRoleForTask,
  getCompatibleRolesForTask,
  canStaffHandleTask,
  findAvailableStaffForTask,
  autoAssignStaffToTask,
  validateStaffAssignment,
  getStaffStatsByRole
};

