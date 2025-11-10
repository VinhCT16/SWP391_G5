/**
 * Migration Script: Consolidate User Models
 * 
 * This script merges data from Customer, Manager, Staff, and Admin models
 * into the unified User model.
 * 
 * Usage:
 *   node server/migrations/consolidateUserModels.js
 * 
 * WARNING: This script modifies your database. Make sure to backup first!
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Manager = require('../models/Manager');
const Staff = require('../models/Staff');
const Admin = require('../models/Admin');
const Contract = require('../models/Contract');
const Request = require('../models/Request');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moving-service', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration statistics
const stats = {
  customers: { processed: 0, errors: 0 },
  managers: { processed: 0, errors: 0 },
  staff: { processed: 0, errors: 0 },
  admins: { processed: 0, errors: 0 },
  contracts: { updated: 0, errors: 0 },
  requests: { updated: 0, errors: 0 }
};

/**
 * Merge Customer data into User
 */
const migrateCustomers = async () => {
  console.log('\n📦 Migrating Customer data...');
  
  try {
    const customers = await Customer.find();
    console.log(`Found ${customers.length} customer records to migrate`);

    for (const customer of customers) {
      try {
        const user = await User.findOne({ email: customer.email.toLowerCase() });
        
        if (!user) {
          console.warn(`⚠️  User not found for customer email: ${customer.email}`);
          stats.customers.errors++;
          continue;
        }

        // Merge customer data into user
        user.chatHistory = customer.chatHistory || [];
        user.reviews = customer.reviews || [];
        user.requestHistory = customer.requestHistory || [];
        
        // Update phone if not set
        if (customer.phone && !user.phone) {
          user.phone = customer.phone;
        }

        await user.save();
        stats.customers.processed++;
        
        // Delete customer record
        await Customer.deleteOne({ _id: customer._id });
      } catch (error) {
        console.error(`❌ Error migrating customer ${customer.email}:`, error.message);
        stats.customers.errors++;
      }
    }

    console.log(`✅ Customer migration complete: ${stats.customers.processed} processed, ${stats.customers.errors} errors`);
  } catch (error) {
    console.error('❌ Error in customer migration:', error);
    throw error;
  }
};

/**
 * Merge Manager data into User
 */
const migrateManagers = async () => {
  console.log('\n👔 Migrating Manager data...');
  
  try {
    const managers = await Manager.find().populate('userId');
    console.log(`Found ${managers.length} manager records to migrate`);

    for (const manager of managers) {
      try {
        if (!manager.userId) {
          console.warn(`⚠️  Manager ${manager.employeeId} has no userId reference`);
          stats.managers.errors++;
          continue;
        }

        const user = await User.findById(manager.userId._id);
        if (!user) {
          console.warn(`⚠️  User not found for manager userId: ${manager.userId._id}`);
          stats.managers.errors++;
          continue;
        }

        // Merge manager data into user
        user.employeeId = manager.employeeId;
        user.department = manager.department;
        user.managerPermissions = manager.permissions || [];
        user.hireDate = manager.hireDate || manager.createdAt;
        
        // Update isActive if different
        if (manager.isActive !== undefined) {
          user.isActive = manager.isActive;
        }

        await user.save();
        stats.managers.processed++;
        
        // Delete manager record
        await Manager.deleteOne({ _id: manager._id });
      } catch (error) {
        console.error(`❌ Error migrating manager ${manager.employeeId}:`, error.message);
        stats.managers.errors++;
      }
    }

    console.log(`✅ Manager migration complete: ${stats.managers.processed} processed, ${stats.managers.errors} errors`);
  } catch (error) {
    console.error('❌ Error in manager migration:', error);
    throw error;
  }
};

/**
 * Merge Staff data into User
 */
const migrateStaff = async () => {
  console.log('\n👷 Migrating Staff data...');
  
  try {
    const staffMembers = await Staff.find().populate('userId');
    console.log(`Found ${staffMembers.length} staff records to migrate`);

    for (const staff of staffMembers) {
      try {
        if (!staff.userId) {
          console.warn(`⚠️  Staff ${staff.employeeId} has no userId reference`);
          stats.staff.errors++;
          continue;
        }

        const user = await User.findById(staff.userId._id);
        if (!user) {
          console.warn(`⚠️  User not found for staff userId: ${staff.userId._id}`);
          stats.staff.errors++;
          continue;
        }

        // Merge staff data into user
        user.employeeId = staff.employeeId;
        user.staffRole = staff.role; // Map 'role' to 'staffRole'
        user.specialization = staff.specialization || [];
        user.availability = staff.availability || {
          isAvailable: true,
          workingHours: { start: "08:00", end: "17:00" },
          workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        };
        user.rating = staff.rating || 5;
        user.currentTasks = staff.currentTasks || [];
        user.hireDate = staff.hireDate || staff.createdAt;
        
        // Update isActive if different
        if (staff.isActive !== undefined) {
          user.isActive = staff.isActive;
        }

        await user.save();
        stats.staff.processed++;
        
        // Delete staff record
        await Staff.deleteOne({ _id: staff._id });
      } catch (error) {
        console.error(`❌ Error migrating staff ${staff.employeeId}:`, error.message);
        stats.staff.errors++;
      }
    }

    console.log(`✅ Staff migration complete: ${stats.staff.processed} processed, ${stats.staff.errors} errors`);
  } catch (error) {
    console.error('❌ Error in staff migration:', error);
    throw error;
  }
};

/**
 * Merge Admin data into User
 */
const migrateAdmins = async () => {
  console.log('\n🔐 Migrating Admin data...');
  
  try {
    const admins = await Admin.find().populate('userId');
    console.log(`Found ${admins.length} admin records to migrate`);

    for (const admin of admins) {
      try {
        if (!admin.userId) {
          console.warn(`⚠️  Admin ${admin.adminId} has no userId reference`);
          stats.admins.errors++;
          continue;
        }

        const user = await User.findById(admin.userId._id);
        if (!user) {
          console.warn(`⚠️  User not found for admin userId: ${admin.userId._id}`);
          stats.admins.errors++;
          continue;
        }

        // Merge admin data into user
        user.adminId = admin.adminId;
        user.department = admin.department;
        user.adminPermissions = admin.permissions || {
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
        };
        user.lastLogin = admin.lastLogin;
        user.hireDate = admin.createdAt;
        
        // Update isActive if different
        if (admin.isActive !== undefined) {
          user.isActive = admin.isActive;
        }

        await user.save();
        stats.admins.processed++;
        
        // Delete admin record
        await Admin.deleteOne({ _id: admin._id });
      } catch (error) {
        console.error(`❌ Error migrating admin ${admin.adminId}:`, error.message);
        stats.admins.errors++;
      }
    }

    console.log(`✅ Admin migration complete: ${stats.admins.processed} processed, ${stats.admins.errors} errors`);
  } catch (error) {
    console.error('❌ Error in admin migration:', error);
    throw error;
  }
};

/**
 * Update Contract references
 */
const updateContractReferences = async () => {
  console.log('\n📄 Updating Contract references...');
  
  try {
    // Update customerId references (should already be User, but verify)
    const contractsWithCustomer = await Contract.find({ customerId: { $exists: true } });
    console.log(`Found ${contractsWithCustomer.length} contracts with customerId`);
    
    // Update managerId references
    const contractsWithManager = await Contract.find({ managerId: { $exists: true } });
    console.log(`Found ${contractsWithManager.length} contracts with managerId`);
    
    for (const contract of contractsWithManager) {
      try {
        // Find the manager by old Manager model reference
        const oldManager = await Manager.findOne({ _id: contract.managerId });
        if (oldManager && oldManager.userId) {
          contract.managerId = oldManager.userId;
          await contract.save();
          stats.contracts.updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating contract ${contract.contractId}:`, error.message);
        stats.contracts.errors++;
      }
    }
    
    // Update assignedStaff.staffId references
    const contractsWithStaff = await Contract.find({ 'assignedStaff.staffId': { $exists: true } });
    console.log(`Found ${contractsWithStaff.length} contracts with assignedStaff`);
    
    for (const contract of contractsWithStaff) {
      try {
        let updated = false;
        for (const assignment of contract.assignedStaff) {
          if (assignment.staffId) {
            // Check if it's an ObjectId that references Staff model
            const oldStaff = await Staff.findOne({ _id: assignment.staffId });
            if (oldStaff && oldStaff.userId) {
              assignment.staffId = oldStaff.userId;
              updated = true;
            }
          }
          if (assignment.assignedBy) {
            const oldManager = await Manager.findOne({ _id: assignment.assignedBy });
            if (oldManager && oldManager.userId) {
              assignment.assignedBy = oldManager.userId;
              updated = true;
            }
          }
        }
        if (updated) {
          await contract.save();
          stats.contracts.updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating contract staff assignments ${contract.contractId}:`, error.message);
        stats.contracts.errors++;
      }
    }
    
    // Update approval.approvedBy references
    const contractsWithApproval = await Contract.find({ 'approval.approvedBy': { $exists: true } });
    console.log(`Found ${contractsWithApproval.length} contracts with approval.approvedBy`);
    
    for (const contract of contractsWithApproval) {
      try {
        if (contract.approval && contract.approval.approvedBy) {
          const oldManager = await Manager.findOne({ _id: contract.approval.approvedBy });
          if (oldManager && oldManager.userId) {
            contract.approval.approvedBy = oldManager.userId;
            await contract.save();
            stats.contracts.updated++;
          }
        }
      } catch (error) {
        console.error(`❌ Error updating contract approval ${contract.contractId}:`, error.message);
        stats.contracts.errors++;
      }
    }

    console.log(`✅ Contract references updated: ${stats.contracts.updated} updated, ${stats.contracts.errors} errors`);
  } catch (error) {
    console.error('❌ Error updating contract references:', error);
    throw error;
  }
};

/**
 * Update Request references
 */
const updateRequestReferences = async () => {
  console.log('\n📋 Updating Request references...');
  
  try {
    // Update assignedStaff.staffId references
    const requestsWithStaff = await Request.find({ 'assignedStaff.staffId': { $exists: true } });
    console.log(`Found ${requestsWithStaff.length} requests with assignedStaff`);
    
    for (const request of requestsWithStaff) {
      try {
        let updated = false;
        for (const assignment of request.assignedStaff || []) {
          if (assignment.staffId) {
            const oldStaff = await Staff.findOne({ _id: assignment.staffId });
            if (oldStaff && oldStaff.userId) {
              assignment.staffId = oldStaff.userId;
              updated = true;
            }
          }
          if (assignment.assignedBy) {
            const oldManager = await Manager.findOne({ _id: assignment.assignedBy });
            if (oldManager && oldManager.userId) {
              assignment.assignedBy = oldManager.userId;
              updated = true;
            }
          }
        }
        if (updated) {
          await request.save();
          stats.requests.updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating request staff assignments ${request.requestId}:`, error.message);
        stats.requests.errors++;
      }
    }
    
    // Update tasks.assignedStaff and tasks.transporter references
    const requestsWithTasks = await Request.find({ 'tasks.assignedStaff': { $exists: true } });
    console.log(`Found ${requestsWithTasks.length} requests with tasks`);
    
    for (const request of requestsWithTasks) {
      try {
        let updated = false;
        for (const task of request.tasks || []) {
          if (task.assignedStaff) {
            const oldStaff = await Staff.findOne({ _id: task.assignedStaff });
            if (oldStaff && oldStaff.userId) {
              task.assignedStaff = oldStaff.userId;
              updated = true;
            }
          }
          if (task.transporter) {
            const oldStaff = await Staff.findOne({ _id: task.transporter });
            if (oldStaff && oldStaff.userId) {
              task.transporter = oldStaff.userId;
              updated = true;
            }
          }
        }
        if (updated) {
          await request.save();
          stats.requests.updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating request tasks ${request.requestId}:`, error.message);
        stats.requests.errors++;
      }
    }
    
    // Update approval.reviewedBy references
    const requestsWithApproval = await Request.find({ 'approval.reviewedBy': { $exists: true } });
    console.log(`Found ${requestsWithApproval.length} requests with approval.reviewedBy`);
    
    for (const request of requestsWithApproval) {
      try {
        if (request.approval && request.approval.reviewedBy) {
          const oldManager = await Manager.findOne({ _id: request.approval.reviewedBy });
          if (oldManager && oldManager.userId) {
            request.approval.reviewedBy = oldManager.userId;
            await request.save();
            stats.requests.updated++;
          }
        }
      } catch (error) {
        console.error(`❌ Error updating request approval ${request.requestId}:`, error.message);
        stats.requests.errors++;
      }
    }

    console.log(`✅ Request references updated: ${stats.requests.updated} updated, ${stats.requests.errors} errors`);
  } catch (error) {
    console.error('❌ Error updating request references:', error);
    throw error;
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  try {
    console.log('🚀 Starting User Model Consolidation Migration...\n');
    console.log('⚠️  WARNING: This will modify your database. Make sure you have a backup!\n');

    // Run migrations in order
    await migrateCustomers();
    await migrateManagers();
    await migrateStaff();
    await migrateAdmins();
    await updateContractReferences();
    await updateRequestReferences();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Customers:  ${stats.customers.processed} processed, ${stats.customers.errors} errors`);
    console.log(`Managers:   ${stats.managers.processed} processed, ${stats.managers.errors} errors`);
    console.log(`Staff:      ${stats.staff.processed} processed, ${stats.staff.errors} errors`);
    console.log(`Admins:     ${stats.admins.processed} processed, ${stats.admins.errors} errors`);
    console.log(`Contracts:  ${stats.contracts.updated} updated, ${stats.contracts.errors} errors`);
    console.log(`Requests:   ${stats.requests.updated} updated, ${stats.requests.errors} errors`);
    console.log('='.repeat(50));
    
    const totalErrors = 
      stats.customers.errors + 
      stats.managers.errors + 
      stats.staff.errors + 
      stats.admins.errors + 
      stats.contracts.errors + 
      stats.requests.errors;

    if (totalErrors === 0) {
      console.log('\n✅ Migration completed successfully with no errors!');
    } else {
      console.log(`\n⚠️  Migration completed with ${totalErrors} errors. Please review the logs above.`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  connectDB()
    .then(() => runMigration())
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, connectDB };

