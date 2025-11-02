// server/controllers/contractController.js
const Request = require("../models/Request");
const Contract = require("../models/Contract");
const { v4: uuidv4 } = require('uuid');

// Create contract from approved request
const createContractFromRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { pricing, paymentMethod, terms } = req.body;
    const managerId = req.userId;

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if request is approved
    if (request.status !== 'approved') {
      return res.status(400).json({ message: "Request must be approved before creating contract" });
    }

    // Check if contract already exists
    if (request.contractId) {
      return res.status(409).json({ message: "Contract already exists for this request" });
    }

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Create contract. If request has assigned staff, carry over
    const contractData = {
      contractId: generateContractId(),
      requestId: request._id,
      customerId: request.customerId,
      managerId: managerId,
      serviceId: request.serviceId || null,
      moveDetails: {
        fromAddress: request.moveDetails.fromAddress,
        toAddress: request.moveDetails.toAddress,
        moveDate: request.moveDetails.moveDate,
        serviceType: request.moveDetails.serviceType
      },
      pricing: {
        basePrice: pricing.basePrice,
        additionalServices: pricing.additionalServices || [],
        totalPrice: pricing.totalPrice,
        deposit: pricing.deposit || 0,
        balance: pricing.totalPrice - (pricing.deposit || 0)
      },
      paymentMethod: {
        type: paymentMethod.type,
        details: paymentMethod.details || {}
      },
      assignedStaff: (request.assignedStaff || []).map(a => ({
        staffId: a.staffId,
        assignedBy: a.assignedBy || managerId,
        assignedAt: a.assignedAt || new Date(),
        status: 'pending',
        notes: a.notes || ''
      })),
      status: 'approved',
      approval: {
        approvedBy: managerId,
        approvedAt: new Date(),
        notes: 'Auto-approved upon contract creation from approved request'
      }
    };

    const contract = await Contract.create(contractData);

    // Update request with contract reference
    request.contractId = contract._id;
    request.status = 'contract_created';
    await request.save();

    res.status(201).json({
      message: "Contract created successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error creating contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get contracts for approval (manager view)
const getContractsForApproval = async (req, res) => {
  try {
    const contracts = await Contract.find({ status: 'draft' })
      .populate('requestId', 'requestId moveDetails customerId')
      .populate('customerId', 'name email phone')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ contracts });
  } catch (err) {
    console.error("Error fetching contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve contract
const approveContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { notes } = req.body;
    const managerId = req.userId;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Update contract status
    contract.status = 'approved';
    contract.approval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      notes: notes || ''
    };

    await contract.save();

    // Update request status
    await Request.findByIdAndUpdate(contract.requestId, {
      status: 'contract_created'
    });

    res.json({
      message: "Contract approved successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error approving contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject contract
const rejectContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { rejectionReason, notes } = req.body;
    const managerId = req.userId;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Update contract status
    contract.status = 'rejected';
    contract.approval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      rejectionReason: rejectionReason,
      notes: notes || ''
    };

    await contract.save();

    // Update request status back to approved (so manager can create new contract)
    await Request.findByIdAndUpdate(contract.requestId, {
      status: 'approved',
      contractId: null
    });

    res.json({
      message: "Contract rejected successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error rejecting contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get customer contracts
const getCustomerContracts = async (req, res) => {
  try {
    const customerId = req.userId;

    const contracts = await Contract.find(filter)
      .populate('customerId', 'name email phone')
      .populate('managerId', 'userId')
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contract.countDocuments(filter);

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error("Error fetching contracts for approval:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Export contract to PDF
const exportContractPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contract = await Contract.findById(id)
      .populate('customerId', 'name email phone')
      .populate('managerId', 'userId')
      .populate('serviceId', 'name price');

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const pdfBuffer = await generateContractPDFBuffer(contract);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${contract.contractId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("Error exporting contract PDF:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all contracts with role-based filtering
const getAllContracts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, requestId } = req.query;

    // Base filter from query
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (requestId) {
      filter.requestId = requestId;
    }

    // Role-based visibility
    const role = req.userRole || req.user?.role;
    if (role === 'customer') {
      // Customers only see approved contracts (per requirement)
      filter.status = 'approved';
    } else if (role === 'staff') {
      // Staff only see contracts assigned to them
      const staff = await Staff.findOne({ userId: req.userId });
      if (!staff) {
        return res.json({ contracts: [], totalPages: 0, currentPage: page, total: 0 });
      }
      filter['assignedStaff.staffId'] = staff._id;
    } else if (role === 'manager' || role === 'admin') {
      // Managers and Admins see all contracts; no additional filter
    } else {
      // Unknown roles see nothing
      return res.json({ contracts: [], totalPages: 0, currentPage: page, total: 0 });
    }

    const query = Contract.find(filter)
      .populate('customerId', 'name email phone')
      .populate('managerId', 'userId')
      .populate('serviceId', 'name price')
      .populate({
        path: 'assignedStaff.staffId',
        select: 'employeeId role',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const [contracts, total] = await Promise.all([
      query,
      Contract.countDocuments(filter)
    ]);

    res.json({
      contracts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (err) {
    console.error("Error fetching contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve and assign staff in one step (Manager only)
const approveAndAssign = async (req, res) => {
  try {
    const { contractId, staffId, notes } = req.body;
    const managerId = req.userId;

    if (!contractId || !staffId) {
      return res.status(400).json({ message: 'contractId and staffId are required' });
    }

    const [contract, staff] = await Promise.all([
      Contract.findById(contractId),
      Staff.findById(staffId)
    ]);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Approve contract
    contract.status = 'approved';
    contract.approval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      notes: notes || ''
    };

    // Assign staff (avoid duplicate assignment)
    const alreadyAssigned = contract.assignedStaff.some(a => a.staffId.toString() === staffId);
    if (!alreadyAssigned) {
      contract.assignedStaff.push({
        staffId,
        assignedBy: managerId,
        assignedAt: new Date(),
        status: 'pending',
        notes: ''
      });
    }

    await contract.save();

    await contract.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'managerId', select: 'userId' },
      { path: 'serviceId', select: 'name price' },
      {
        path: 'assignedStaff.staffId',
        select: 'employeeId role',
        populate: { path: 'userId', select: 'name email phone' }
      }
    ]);

    return res.status(200).json({
      message: 'Contract approved and staff assigned successfully',
      contract
    });
  } catch (err) {
    console.error('Error approving and assigning contract:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Assign staff to contract (Manager only)
const assignStaffToContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, notes } = req.body;
    const managerId = req.userId;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if staff is already assigned
    const alreadyAssigned = contract.assignedStaff.some(
      assignment => assignment.staffId.toString() === staffId
    );
    
    if (alreadyAssigned) {
      return res.status(400).json({ message: "Staff is already assigned to this contract" });
    }

    // Add staff assignment
    contract.assignedStaff.push({
      staffId,
      assignedBy: managerId,
      assignedAt: new Date(),
      status: 'pending',
      notes: notes || ''
    });

    // Update contract status
    if (contract.status === 'signed' || contract.status === 'approved') {
      contract.status = 'staff_pending';
    }

    await contract.save();

    // Populate assigned staff details
    await contract.populate({
      path: 'assignedStaff.staffId',
      select: 'employeeId role',
      populate: { path: 'userId', select: 'name email phone' }
    });

    res.json({
      message: "Staff assigned successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error assigning staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available staff for assignment
const getAvailableStaff = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Get all active staff
    const allStaff = await Staff.find({ isActive: true })
      .populate('userId', 'name email phone');
    
    // Get already assigned staff IDs
    const assignedStaffIds = contract.assignedStaff.map(a => a.staffId.toString());
    
    // Filter available staff
    const availableStaff = allStaff.filter(
      staff => !assignedStaffIds.includes(staff._id.toString())
    );

    res.json({ availableStaff });
  } catch (err) {
    console.error("Error fetching available staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept assignment (Staff only)
const acceptAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const staffUserId = req.userId;

    // Find staff record
    const staff = await Staff.findOne({ userId: staffUserId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Find the assignment for this staff
    const assignment = contract.assignedStaff.find(
      a => a.staffId.toString() === staff._id.toString()
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment cannot be accepted" });
    }

    // Update assignment status
    assignment.status = 'accepted';
    assignment.acceptedAt = new Date();

    // Update contract status
    const allAccepted = contract.assignedStaff.every(
      a => a.status === 'accepted'
    );

    if (allAccepted) {
      contract.status = 'active';
    } else if (contract.status === 'staff_pending') {
      contract.status = 'in_progress';
    }

    await contract.save();

    res.json({
      message: "Assignment accepted successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error accepting assignment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject assignment (Staff only)
const rejectAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const staffUserId = req.userId;

    const staff = await Staff.findOne({ userId: staffUserId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const assignment = contract.assignedStaff.find(
      a => a.staffId.toString() === staff._id.toString()
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment cannot be rejected" });
    }

    assignment.status = 'rejected';
    assignment.notes = reason || assignment.notes;

    await contract.save();

    res.json({
      message: "Assignment rejected successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error rejecting assignment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get contracts assigned to staff
const getAssignedContracts = async (req, res) => {
  try {
    const staffUserId = req.userId;

    const staff = await Staff.findOne({ userId: staffUserId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const contracts = await Contract.find({
      'assignedStaff.staffId': staff._id
    })
      .populate('customerId', 'name email phone')
      .populate('managerId', 'userId')
      .populate('serviceId', 'name price')
      .populate({
        path: 'assignedStaff.staffId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ createdAt: -1 });

    res.json({ contracts });
  } catch (err) {
    console.error("Error fetching customer contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get contract progress (for customer)
const getContractProgress = async (req, res) => {
  try {
    const { contractId } = req.params;
    const customerId = req.userId;

    const contract = await Contract.findById(contractId)
      .populate('requestId')
      .populate('managerId', 'name email');

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if customer owns this contract
    if (contract.customerId.toString() !== customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get request with tasks
    const request = await Request.findById(contract.requestId)
      .populate('tasks.assignedStaff', 'name email')
      .populate('tasks.transporter', 'name email');

    // Calculate progress
    const totalTasks = request.tasks.length;
    const completedTasks = request.tasks.filter(task => task.status === 'completed').length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      contract: contract,
      request: request,
      progress: {
        totalTasks,
        completedTasks,
        progressPercentage: Math.round(progressPercentage),
        status: request.status
      }
    });
  } catch (err) {
    console.error("Error fetching contract progress:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createContractFromRequest,
  getContractsForApproval,
  approveContract,
  rejectContract,
  getContractsForApproval,
  exportContractPDF,
  assignStaffToContract,
  getAvailableStaff,
  acceptAssignment,
  rejectAssignment,
  getAssignedContracts,
  approveAndAssign
};
