# Staff Role-Based Task Assignment System

## Overview

This document describes the implementation of a role-based staff assignment system that ensures tasks are assigned to staff members with the appropriate skills and roles.

## Staff Roles

The system supports the following staff roles:

1. **packager** - Handles packing and unpacking tasks
2. **transporter** - Handles transportation tasks
3. **supervisor** - Can handle all task types (flexible, experienced staff)
4. **loader** - Specialized in loading tasks
5. **unloader** - Specialized in unloading tasks
6. **reviewer** - Specialized in review/survey tasks

## Task Types and Role Mapping

| Task Type | Compatible Roles (in priority order) |
|-----------|--------------------------------------|
| packing | packager, supervisor |
| loading | loader, packager, transporter, supervisor |
| transporting | transporter, supervisor |
| unloading | unloader, packager, transporter, supervisor |
| unpacking | packager, supervisor |
| review | reviewer, supervisor, packager |

## Key Features

### 1. Automatic Role-Based Assignment
- When tasks are created, the system automatically finds staff with compatible roles
- Prioritizes staff with specialized roles (e.g., loader for loading tasks)
- Falls back to more general roles (e.g., supervisor) if specialists aren't available

### 2. Load Balancing
- Assigns tasks to staff with the fewest current active tasks
- Considers staff availability status
- Takes into account staff ratings for quality assurance

### 3. Validation
- Prevents assigning tasks to incompatible staff roles
- Validates staff availability before assignment
- Ensures staff are active before assignment

### 4. Specialization Support
- Staff can have specializations (fragile_items, heavy_items, electronics, etc.)
- Tasks can prefer staff with specific specializations
- Helps match expertise to task requirements

## Implementation Details

### Utility Functions (`server/utils/staffAssignment.js`)

#### `findAvailableStaffForTask(taskType, options)`
Finds all available staff members who can handle a specific task type.

**Parameters:**
- `taskType`: The type of task (packing, loading, transporting, etc.)
- `options`: Configuration object
  - `excludeStaffIds`: Array of staff IDs to exclude
  - `minRating`: Minimum staff rating (0-5)
  - `maxCurrentTasks`: Maximum number of current tasks
  - `preferredSpecializations`: Array of preferred specializations

**Returns:** Array of staff members sorted by availability and load

#### `autoAssignStaffToTask(taskType, options)`
Automatically assigns the best available staff member to a task.

**Returns:** Selected staff member object or null if none available

#### `validateStaffAssignment(staffId, taskType)`
Validates if a staff member can be assigned to a specific task type.

**Returns:** `{ valid: boolean, reason?: string }`

#### `canStaffHandleTask(staffRole, taskType)`
Checks if a staff role is compatible with a task type.

**Returns:** Boolean

### Usage Examples

#### Auto-assign staff to a review task
```javascript
const { autoAssignStaffToTask } = require("../utils/staffAssignment");

const selectedStaff = await autoAssignStaffToTask('review', {
  minRating: 4,
  maxCurrentTasks: 5
});
```

#### Find available packagers
```javascript
const { findAvailableStaffForTask } = require("../utils/staffAssignment");

const packagers = await findAvailableStaffForTask('packing', {
  preferredSpecializations: ['fragile_items', 'electronics']
});
```

#### Validate assignment before saving
```javascript
const { validateStaffAssignment } = require("../utils/staffAssignment");

const validation = await validateStaffAssignment(staffId, 'transporting');
if (!validation.valid) {
  return res.status(400).json({ message: validation.reason });
}
```

## Database Schema

### User Model Updates
- `staffRole`: Enum with values: `["packager", "transporter", "supervisor", "loader", "unloader", "reviewer"]`
- `specialization`: Array of specializations
- `availability.isAvailable`: Boolean flag for availability
- `rating`: Staff performance rating (1-5)

## Benefits

1. **Efficiency**: Tasks are assigned to staff with the right skills
2. **Quality**: Specialized staff handle specialized tasks
3. **Flexibility**: Supervisors can handle any task type when needed
4. **Load Balancing**: Work is distributed evenly among staff
5. **Scalability**: Easy to add new roles or task types

## Future Enhancements

1. **Multi-role staff**: Allow staff to have multiple roles
2. **Skill levels**: Add proficiency levels (beginner, intermediate, expert)
3. **Certifications**: Track staff certifications for specialized tasks
4. **Performance tracking**: Track task completion rates by role
5. **Dynamic role assignment**: Automatically promote staff to supervisor role based on performance

## Migration Notes

Existing staff members will need to have their `staffRole` field updated. The system will work with existing staff, but for optimal assignment, all staff should have appropriate roles assigned.

To update existing staff:
```javascript
// Example: Update all staff without roles to 'packager' (default)
await User.updateMany(
  { role: 'staff', staffRole: { $exists: false } },
  { $set: { staffRole: 'packager' } }
);
```

