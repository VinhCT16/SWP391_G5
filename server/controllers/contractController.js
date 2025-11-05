const Contract = require("../models/Contract");
const Request = require("../models/Request");
const Service = require("../models/Service");
const Staff = require("../models/Staff");
const Manager = require("../models/Manager");
const Customer = require("../models/Customer");
const User = require("../models/User");
const { v4: uuidv4 } = require('uuid');
const { generateContractPDFBuffer } = require('../utils/pdfGenerator');

// Generate unique contract ID
const generateContractId = () => `CON-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Helper function to find or create Manager document
const findOrCreateManager = async (managerUserId) => {
  // Verify user is a manager
  const managerUser = await User.findById(managerUserId);
  if (!managerUser || managerUser.role !== 'manager') {
    throw new Error('Only managers can perform this action');
  }

  // Try to find active manager
  let manager = await Manager.findOne({ userId: managerUserId, isActive: true });
  if (manager) {
    return manager;
  }

  // Check if manager exists but is inactive
  const inactiveManager = await Manager.findOne({ userId: managerUserId });
  if (inactiveManager) {
    throw new Error('Manager account is inactive. Please contact an administrator.');
  }

  // Manager document doesn't exist - try to auto-create with defaults
  console.log('Manager document not found, attempting to create with defaults:', { userId: managerUserId });
  try {
    // Generate a unique employeeId
    const existingManagers = await Manager.countDocuments();
    const employeeId = `MGR-${String(existingManagers + 1).padStart(4, '0')}`;
    
    manager = await Manager.create({
      userId: managerUserId,
      employeeId: employeeId,
      department: 'Operations', // Default department
      permissions: ['approve_contracts', 'manage_staff', 'view_reports'],
      isActive: true
    });
    console.log('✅ Auto-created Manager profile:', { managerId: manager._id, employeeId: manager.employeeId });
    return manager;
  } catch (createErr) {
    console.error('Failed to auto-create Manager profile:', createErr);
    // Check if it's a duplicate employeeId error
    if (createErr.code === 11000) {
      // Try again with timestamp-based ID
      const timestamp = Date.now();
      try {
        manager = await Manager.create({
          userId: managerUserId,
          employeeId: `MGR-${timestamp}`,
          department: 'Operations',
          permissions: ['approve_contracts', 'manage_staff', 'view_reports'],
          isActive: true
        });
        console.log('✅ Auto-created Manager profile with timestamp ID:', { managerId: manager._id, employeeId: manager.employeeId });
        return manager;
      } catch (retryErr) {
        console.error('Failed to create Manager profile on retry:', retryErr);
        throw new Error('Manager profile not found. Please complete your manager profile setup by contacting an administrator or visiting your profile settings.');
      }
    } else {
      throw new Error('Manager profile not found. Please complete your manager profile setup by contacting an administrator or visiting your profile settings.');
    }
  }
};

// Get all services (for contract creation)
const getAllServices = async (req, res) => {
  try {
    console.log('=== getAllServices called ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request path:', req.path);
    console.log('User ID:', req.userId);
    console.log('User Role:', req.userRole);
    
    console.log('Fetching services from database...');
    let services = await Service.find({}).select('name price _id').sort({ name: 1 });
    console.log('Services found (before check):', services.length);
    
    // If no services exist, create default services
    if (!services || services.length === 0) {
      console.log('No services found in database. Creating default services...');
      const defaultServices = [
        { name: 'Local Move', price: 500 },
        { name: 'Long Distance Move', price: 1500 },
        { name: 'Commercial Move', price: 800 }
      ];
      
      try {
        const createdServices = await Service.insertMany(defaultServices);
        console.log(`✅ Created ${createdServices.length} default services`);
        services = createdServices;
      } catch (insertErr) {
        console.error('Error creating default services:', insertErr);
        // Continue with empty array
        services = [];
      }
    }
    
    const servicesData = services.map(s => ({ id: s._id, name: s.name, price: s.price }));
    console.log(`✅ Found ${services.length} services:`, servicesData);
    console.log('Sending response with services:', { servicesCount: services.length });
    res.json({ services: services || [] });
  } catch (err) {
    console.error("❌ Error fetching services:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      message: "Server error while fetching services",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create contract from approved request
const createContractFromRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { serviceId, pricing, paymentMethod, terms } = req.body;
    const managerUserId = req.userId;

    console.log('=== createContractFromRequest called ===', {
      requestId,
      managerUserId,
      userRole: req.userRole,
      serviceId,
      hasPricing: !!pricing,
      hasPaymentMethod: !!paymentMethod,
      hasTerms: !!terms
    });

    // Find or create Manager document from userId
    let manager;
    try {
      manager = await findOrCreateManager(managerUserId);
      console.log('✅ Manager found/created:', { managerId: manager._id, employeeId: manager.employeeId });
    } catch (managerErr) {
      console.error('❌ Manager error:', {
        message: managerErr.message,
        userId: managerUserId,
        userRole: req.userRole,
        error: managerErr
      });
      return res.status(403).json({ 
        message: managerErr.message,
        details: process.env.NODE_ENV === 'development' ? {
          userId: managerUserId,
          userRole: req.userRole
        } : undefined
      });
    }

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
      console.error('Service not found:', { serviceId });
      return res.status(404).json({ 
        message: `Service not found with ID: ${serviceId}. Please select a valid service.` 
      });
    }
    
    console.log('Service found:', { serviceId: service._id, name: service.name, price: service.price });

    // Calculate pricing with fallbacks
    let basePrice = Number(pricing?.basePrice) || Number(service.price) || 0;
    const additionalTotal = (pricing?.additionalServices || []).reduce((sum, s) => {
      return sum + (Number(s.price) || 0);
    }, 0);
    
    const totalPrice = Number(pricing?.totalPrice) || (basePrice + additionalTotal);
    const deposit = Number(pricing?.deposit) || 0;
    const balance = totalPrice - deposit;

    // Map serviceType to match Contract enum
    const validServiceTypes = ["Local Move", "Long Distance", "Commercial"];
    let contractServiceType = request.moveDetails?.serviceType || 'Local Move';
    
    if (!validServiceTypes.includes(contractServiceType)) {
      const serviceTypeLower = contractServiceType.toLowerCase();
      if (serviceTypeLower.includes('local')) {
        contractServiceType = 'Local Move';
      } else if (serviceTypeLower.includes('long') || serviceTypeLower.includes('distance')) {
        contractServiceType = 'Long Distance';
      } else if (serviceTypeLower.includes('commercial')) {
        contractServiceType = 'Commercial';
      } else {
        contractServiceType = 'Local Move';
      }
    }

    // Find or create Customer document from User ID
    // Request.customerId is User ID, but Contract.customerId needs Customer document ID
    const customerUser = await User.findById(request.customerId);
    if (!customerUser || customerUser.role !== 'customer') {
      return res.status(400).json({ message: "Invalid customer for this request" });
    }

    let customer = await Customer.findOne({ userId: request.customerId });
    if (!customer) {
      // Create Customer profile if it doesn't exist
      customer = await Customer.create({
        userId: request.customerId,
        email: customerUser.email,
        phone: customerUser.phone || request.moveDetails?.phone || '0000000000'
      });
      console.log('Created Customer profile:', { customerId: customer._id, email: customer.email });
    }

    // Create contract. If request has assigned staff, carry over
    const contractData = {
      contractId: generateContractId(),
      requestId: request._id,
      customerId: customer._id, // Use Customer document ID, not User ID
      managerId: manager._id, // Use Manager document ID, not User ID
      serviceId,
      moveDetails: {
        fromAddress: request.moveDetails.fromAddress,
        toAddress: request.moveDetails.toAddress,
        moveDate: request.moveDetails.moveDate,
        serviceType: contractServiceType
      },
      pricing: {
        basePrice: basePrice,
        additionalServices: pricing.additionalServices || [],
        totalPrice: totalPrice,
        deposit: deposit,
        balance: balance
      },
      paymentMethod: {
        type: paymentMethod?.type || 'cash',
        details: paymentMethod?.details || {}
      },
      terms: {
        liability: terms?.liability || 'Standard moving liability coverage',
        cancellation: terms?.cancellation || '24-hour notice required for cancellation',
        additionalTerms: terms?.additionalTerms || ''
      },
      assignedStaff: (request.assignedStaff || []).map(a => ({
        staffId: a.staffId,
        assignedBy: a.assignedBy || manager._id,
        assignedAt: a.assignedAt || new Date(),
        status: 'pending',
        notes: a.notes || ''
      })),
      status: 'approved',
      approval: {
        approvedBy: manager._id,
        approvedAt: new Date(),
        notes: 'Auto-approved upon contract creation from approved request'
      }
    };

    console.log('Creating contract with data:', {
      contractId: contractData.contractId,
      managerId: contractData.managerId,
      customerId: contractData.customerId,
      serviceId: contractData.serviceId,
      basePrice: contractData.pricing.basePrice,
      totalPrice: contractData.pricing.totalPrice
    });

    const contract = await Contract.create(contractData);
    console.log('Contract created successfully:', { contractId: contract._id, contractIdStr: contract.contractId });

    // Update request with contract reference
    request.contractId = contract._id;
    request.status = 'contract_created';
    await request.save();
    console.log('Request updated with contract reference');

    // Populate contract details
    await contract.populate([
      { 
        path: 'customerId', 
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { 
        path: 'managerId', 
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { path: 'serviceId', select: 'name price' }
    ]);

    res.status(201).json({
      message: "Contract created successfully",
      contract: {
        id: contract._id,
        contractId: contract.contractId,
        status: contract.status,
        moveDetails: contract.moveDetails,
        pricing: contract.pricing,
        paymentMethod: contract.paymentMethod,
        createdAt: contract.createdAt
      }
    });
  } catch (err) {
    console.error("Error creating contract:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      return res.status(400).json({ 
        message: "Validation error", 
        details: validationErrors
      });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "Contract ID already exists. Please try again." 
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: `Invalid ${err.path}: ${err.value}. Please check the data format.` 
      });
    }
    
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Failed to create contract. Please check all fields and try again.'
    });
  }
};

// Get contract by ID
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id)
      .populate({
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'managerId',
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('serviceId', 'name price')
      .populate({
        path: 'assignedStaff.staffId',
        select: 'employeeId role',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    res.json({ contract });
  } catch (err) {
    console.error("Error fetching contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update contract status
const updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    contract.status = status;
    if (notes) {
      contract.approval.notes = notes;
    }

    if (status === 'signed') {
      contract.signatures.customerSigned = true;
      contract.signatures.managerSigned = true;
      contract.signatures.signedAt = new Date();
    }

    await contract.save();

    res.json({
      message: "Contract status updated successfully",
      contract: {
        id: contract._id,
        contractId: contract.contractId,
        status: contract.status,
        signatures: contract.signatures
      }
    });
  } catch (err) {
    console.error("Error updating contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve contract (Manager only)
const approveContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const managerUserId = req.userId;

    // Find or create Manager document from userId
    let manager;
    try {
      manager = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    contract.status = 'approved';
    contract.approval = {
      approvedBy: manager._id, // Use Manager document ID, not User ID
      approvedAt: new Date(),
      notes: notes || ''
    };

    await contract.save();

    // Populate contract details for response
    await contract.populate([
      { 
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { 
        path: 'managerId', 
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { path: 'serviceId', select: 'name price' }
    ]);

    res.json({
      message: "Contract approved successfully",
      contract: {
        id: contract._id,
        contractId: contract.contractId,
        status: contract.status,
        approval: contract.approval,
        createdAt: contract.createdAt
      }
    });
  } catch (err) {
    console.error("Error approving contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject contract (Manager only)
const rejectContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, notes } = req.body;
    const managerUserId = req.userId;

    // Find or create Manager document from userId
    let manager;
    try {
      manager = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    contract.status = 'cancelled';
    contract.approval = {
      approvedBy: manager._id, // Use Manager document ID, not User ID
      approvedAt: new Date(),
      rejectionReason: rejectionReason,
      notes: notes || ''
    };

    await contract.save();

    res.json({
      message: "Contract rejected successfully",
      contract: {
        id: contract._id,
        contractId: contract.contractId,
        status: contract.status,
        approval: contract.approval
      }
    });
  } catch (err) {
    console.error("Error rejecting contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get contracts for manager approval
const getContractsForApproval = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, showSigned = false } = req.query;
    
    let filter = {};
    
    // If showSigned is true, show contracts signed by both parties
    if (showSigned === 'true') {
      filter = {
        'signatures.customerSigned': true,
        'signatures.managerSigned': true
      };
    } else if (status) {
      // Specific status filter
      filter.status = status;
    } else {
      // Default: show pending approval contracts
      filter.status = { $in: ['draft', 'pending_approval'] };
    }

    const contracts = await Contract.find(filter)
      .populate({
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'managerId',
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      })
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
      .populate({
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'managerId',
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      })
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
      .populate({
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'managerId',
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      })
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
    const managerUserId = req.userId;

    // Find or create Manager document from userId
    let manager;
    try {
      manager = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

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
      approvedBy: manager._id, // Use Manager document ID, not User ID
      approvedAt: new Date(),
      notes: notes || ''
    };

    // Assign staff (avoid duplicate assignment)
    const alreadyAssigned = contract.assignedStaff.some(a => a.staffId.toString() === staffId);
    if (!alreadyAssigned) {
      contract.assignedStaff.push({
        staffId,
        assignedBy: manager._id, // Use Manager document ID, not User ID
        assignedAt: new Date(),
        status: 'pending',
        notes: ''
      });
    }

    await contract.save();

    await contract.populate([
      { 
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { 
        path: 'managerId', 
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      },
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
    const managerUserId = req.userId;

    // Find or create Manager document from userId
    let manager;
    try {
      manager = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

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
      assignedBy: manager._id, // Use Manager document ID, not User ID
      assignedAt: new Date(),
      status: 'pending',
      notes: notes || ''
    });

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

    if (!assignment || assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment not found or cannot be accepted" });
    }

    // Update assignment status
    assignment.status = 'accepted';
    assignment.acceptedAt = new Date();

    // Update contract status if all staff accepted
    if (contract.assignedStaff.every(a => a.status === 'accepted')) {
      contract.status = 'active';
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

    if (!assignment || assignment.status !== 'pending') {
      return res.status(400).json({ message: "Assignment not found or cannot be rejected" });
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
      .populate({
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'managerId',
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('serviceId', 'name price')
      .populate({
        path: 'assignedStaff.staffId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ createdAt: -1 });

    res.json({ contracts });
  } catch (err) {
    console.error("Error fetching assigned contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Manager signs contract
const managerSignContract = async (req, res) => {
  try {
    const { id } = req.params;
    const managerUserId = req.userId;

    // Find or create Manager document from userId
    let manager;
    try {
      manager = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if already signed by manager
    if (contract.signatures.managerSigned) {
      return res.status(400).json({ message: "Contract already signed by manager" });
    }

    // Update manager signature
    contract.signatures.managerSigned = true;
    
    // If customer also signed, update status and signedAt
    if (contract.signatures.customerSigned) {
      contract.status = 'signed';
      contract.signatures.signedAt = new Date();
    }

    await contract.save();

    // Populate contract details
    await contract.populate([
      { 
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { 
        path: 'managerId', 
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { path: 'serviceId', select: 'name price' },
      {
        path: 'assignedStaff.staffId',
        select: 'employeeId role',
        populate: { path: 'userId', select: 'name email phone' }
      }
    ]);

    res.json({
      message: "Contract signed successfully by manager",
      contract: contract
    });
  } catch (err) {
    console.error("Error signing contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Customer signs contract
const customerSignContract = async (req, res) => {
  try {
    const { id } = req.params;
    const customerUserId = req.userId;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Verify customer owns this contract
    const Customer = require("../models/Customer");
    const customer = await Customer.findOne({ userId: customerUserId });
    if (!customer || contract.customerId.toString() !== customer._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to sign this contract" });
    }

    // Check if already signed by customer
    if (contract.signatures.customerSigned) {
      return res.status(400).json({ message: "Contract already signed by customer" });
    }

    // Update customer signature
    contract.signatures.customerSigned = true;
    
    // If manager also signed, update status and signedAt
    if (contract.signatures.managerSigned) {
      contract.status = 'signed';
      contract.signatures.signedAt = new Date();
    }

    await contract.save();

    // Populate contract details
    await contract.populate([
      { 
        path: 'customerId',
        select: 'userId email phone',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { 
        path: 'managerId', 
        select: 'userId employeeId department',
        populate: { path: 'userId', select: 'name email phone' }
      },
      { path: 'serviceId', select: 'name price' }
    ]);

    res.json({
      message: "Contract signed successfully by customer",
      contract: contract
    });
  } catch (err) {
    console.error("Error signing contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createContractFromRequest,
  getContractById,
  updateContractStatus,
  getAllContracts,
  approveContract,
  rejectContract,
  getContractsForApproval,
  exportContractPDF,
  assignStaffToContract,
  getAvailableStaff,
  acceptAssignment,
  rejectAssignment,
  getAssignedContracts,
  approveAndAssign,
  managerSignContract,
  customerSignContract,
  getAllServices
};
