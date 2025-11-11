// server/controllers/contractController.js
const Request = require("../models/Request");
const Contract = require("../models/Contract");
const Service = require("../models/Service");
const User = require("../models/User");
const { v4: uuidv4 } = require('uuid');

// Generate unique contract ID
const generateContractId = () => {
  return `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Helper function to automatically create contract from approved request
// This is called when a request is approved to automatically create a contract
const autoCreateContractFromRequest = async (requestId, managerUserId) => {
  try {
    console.log('=== autoCreateContractFromRequest called ===', { requestId, managerUserId });

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Check if contract already exists
    if (request.contractId) {
      console.log('Contract already exists for this request');
      return await Contract.findById(request.contractId);
    }

    // Check if request is approved
    if (request.status !== 'approved') {
      throw new Error("Request must be approved before creating contract");
    }

    // Verify manager and get user ID
    let managerId;
    try {
      managerId = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      throw new Error(`Manager error: ${managerErr.message}`);
    }

    // Get default service (first available service, or create a default one)
    let service = await Service.findOne({});
    if (!service) {
      // Create a default service if none exists
      service = await Service.create({
        name: 'Standard Moving Service',
        price: 500
      });
      console.log('Created default service:', service._id);
    }

    // Get customer user and verify
    const customerUser = await User.findById(request.customerId);
    if (!customerUser || customerUser.role !== 'customer') {
      throw new Error("Invalid customer for this request");
    }

    // Use customer user ID directly (Contract model references User, not Customer)
    const customerUserId = customerUser._id;

    // Calculate pricing - use request estimated price if available, otherwise use service price
    const estimatedPrice = request.estimatedPrice || {};
    const basePrice = Number(estimatedPrice.basePrice) || Number(service.price) || 500;
    const additionalServices = estimatedPrice.additionalServices || [];
    const additionalTotal = additionalServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const totalPrice = Number(estimatedPrice.totalPrice) || (basePrice + additionalTotal);
    const deposit = Number(estimatedPrice.deposit) || 0;
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

    // Create contract with default values
    const contractData = {
      contractId: generateContractId(),
      requestId: request._id,
      customerId: customerUserId, // Use User ID directly
      managerId: managerId, // Use User ID directly
      serviceId: service._id,
      moveDetails: {
        fromAddress: request.moveDetails.fromAddress,
        toAddress: request.moveDetails.toAddress,
        moveDate: request.moveDetails.moveDate,
        serviceType: contractServiceType
      },
      pricing: {
        basePrice: basePrice,
        additionalServices: additionalServices,
        totalPrice: totalPrice,
        deposit: deposit,
        balance: balance
      },
      paymentMethod: {
        type: 'cash',
        details: {}
      },
      terms: {
        liability: 'Standard moving liability coverage',
        cancellation: '24-hour notice required for cancellation',
        additionalTerms: ''
      },
      assignedStaff: (request.assignedStaff || []).map(a => ({
        staffId: a.staffId,
        assignedBy: a.assignedBy || managerId, // Use User ID directly
        assignedAt: a.assignedAt || new Date(),
        status: 'pending',
        notes: a.notes || ''
      })),
      status: 'pending_approval', // Contract needs manager approval
      approval: {
        approvedBy: null,
        approvedAt: null,
        notes: 'Automatically created from approved request. Manager can review and approve.'
      }
    };

    console.log('Creating contract automatically:', {
      contractId: contractData.contractId,
      managerId: contractData.managerId,
      customerId: contractData.customerId,
      serviceId: contractData.serviceId,
      status: contractData.status
    });

    const contract = await Contract.create(contractData);
    console.log('Contract created automatically:', { contractId: contract._id });

    // Update request with contract reference
    request.contractId = contract._id;
    request.status = 'contract_created';
    await request.save();
    console.log('Request updated with contract reference');

    return contract;
  } catch (err) {
    console.error("Error in autoCreateContractFromRequest:", err);
    throw err;
  }
};

// Helper function to verify manager and return user ID
// Since we're using User model directly, we just need to verify the user is a manager
const findOrCreateManager = async (managerUserId) => {
  // Verify user is a manager
  const managerUser = await User.findById(managerUserId);
  if (!managerUser || managerUser.role !== 'manager') {
    throw new Error('Only managers can perform this action');
  }

  // Check if user is active
  if (!managerUser.isActive) {
    throw new Error('Manager account is inactive. Please contact an administrator.');
  }

  // Return the user ID directly (Contract model references User, not Manager)
  return managerUser._id;
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

    // Verify manager and get user ID
    let managerId;
    try {
      managerId = await findOrCreateManager(managerUserId);
      console.log('✅ Manager verified:', { managerId: managerId });
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

    // Verify customer user
    const customerUser = await User.findById(request.customerId);
    if (!customerUser || customerUser.role !== 'customer') {
      return res.status(400).json({ message: "Invalid customer for this request" });
    }

    // Use customer user ID directly (Contract model references User, not Customer)
    const customerId = customerUser._id;

    // Create contract. If request has assigned staff, carry over
    const contractData = {
      contractId: generateContractId(),
      requestId: request._id,
      customerId: customerId, // Use User ID directly
      managerId: managerId, // Use User ID directly
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
      { path: 'customerId', select: 'name email phone role' },
      { path: 'managerId', select: 'name email phone role' },
      { path: 'serviceId', select: 'name price' }
    ]);

    res.status(201).json({
      message: "Contract created successfully",
      contract: contract
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

// Get contracts for approval (manager view)
const getContractsForApproval = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get contracts that need approval (pending_approval or draft status)
    const filter = {
      status: { $in: ['draft', 'pending_approval'] }
    };

    const contracts = await Contract.find(filter)
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role')
      .populate('serviceId', 'name price')
      .populate('assignedStaff.staffId', 'name email phone role')
      .populate('requestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contract.countDocuments(filter);

    res.json({
      contracts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContracts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Error fetching contracts for approval:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve contract
const approveContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const managerUserId = req.userId;

    // Verify manager and get user ID
    let managerId;
    try {
      managerId = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Update contract status
    contract.status = 'approved';
    contract.approval = {
      approvedBy: managerId, // Use User ID directly
      approvedAt: new Date(),
      notes: notes || ''
    };

    await contract.save();

    // Populate contract details for response
    await contract.populate([
      { path: 'customerId', select: 'name email phone role' },
      { path: 'managerId', select: 'name email phone role' },
      { path: 'serviceId', select: 'name price' }
    ]);

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
    const { id } = req.params;
    const { rejectionReason, notes } = req.body;
    const managerUserId = req.userId;

    // Verify manager and get user ID
    let managerId;
    try {
      managerId = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Update contract status
    contract.status = 'rejected';
    contract.approval = {
      approvedBy: managerId, // Use User ID directly
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
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role')
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Contract.countDocuments(filter);

    res.json({
      contracts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (err) {
    console.error("Error fetching customer contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Export contract to PDF
const exportContractPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contract = await Contract.findById(id)
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role employeeId department')
      .populate('serviceId', 'name price');

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // TODO: Implement PDF generation
    // For now, return a placeholder
    const pdfBuffer = Buffer.from('PDF placeholder - implement PDF generation');
    
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
      const user = await User.findById(req.userId);
      if (!user || user.role !== 'staff') {
        return res.json({ contracts: [], totalPages: 0, currentPage: page, total: 0 });
      }
      filter['assignedStaff.staffId'] = user._id;
    } else if (role === 'manager' || role === 'admin') {
      // Managers and Admins see all contracts; no additional filter
    } else {
      // Unknown roles see nothing
      return res.json({ contracts: [], totalPages: 0, currentPage: page, total: 0 });
    }

    const query = Contract.find(filter)
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role')
      .populate('serviceId', 'name price')
      .populate('assignedStaff.staffId', 'name email phone role')
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

// Get contract by ID
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.userRole || req.user?.role;

    const contract = await Contract.findById(id)
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role')
      .populate('serviceId', 'name price')
      .populate('assignedStaff.staffId', 'name email phone role')
      .populate('requestId');

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Role-based access control
    if (role === 'customer') {
      // Customers can only see approved contracts that belong to them
      // Contract.customerId is User ID, so compare directly
      if (contract.customerId.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (contract.status !== 'approved') {
        return res.status(403).json({ message: "Contract not yet approved" });
      }
    } else if (role === 'staff') {
      // Staff can only see contracts assigned to them
      const user = await User.findById(req.userId);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied" });
      }
      const isAssigned = contract.assignedStaff.some(
        a => a.staffId && a.staffId.toString() === user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: "You are not assigned to this contract" });
      }
    }
    // Managers and admins can see all contracts

    res.json({ contract });
  } catch (err) {
    console.error("Error fetching contract:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update contract status (Manager only)
const updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
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

    // Validate status
    const validStatuses = [
      "draft",
      "pending_approval",
      "approved",
      "signed",
      "staff_pending",
      "active",
      "in_progress",
      "completed",
      "cancelled"
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update status
    if (status) {
      contract.status = status;
    }

    // Update notes if provided
    if (notes !== undefined) {
      if (!contract.approval) {
        contract.approval = {};
      }
      contract.approval.notes = notes;
    }

    await contract.save();

    // Populate contract details for response
    await contract.populate([
      { path: 'customerId', select: 'name email phone role' },
      { path: 'managerId', select: 'name email phone role employeeId department' },
      { path: 'serviceId', select: 'name price' }
    ]);

    res.json({
      message: "Contract status updated successfully",
      contract: contract
    });
  } catch (err) {
    console.error("Error updating contract status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve and assign staff in one step (Manager only)
const approveAndAssign = async (req, res) => {
  try {
    const { contractId, staffId, notes } = req.body;
    const managerUserId = req.userId;

    // Verify manager and get user ID
    let managerId;
    try {
      managerId = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    if (!contractId || !staffId) {
      return res.status(400).json({ message: 'contractId and staffId are required' });
    }

    const [contract, staff] = await Promise.all([
      Contract.findById(contractId),
      User.findById(staffId)
    ]);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Approve contract
    contract.status = 'approved';
    contract.approval = {
      approvedBy: managerId, // Use User ID directly
      approvedAt: new Date(),
      notes: notes || ''
    };

    // Assign staff (avoid duplicate assignment)
    const alreadyAssigned = contract.assignedStaff.some(a => a.staffId.toString() === staffId);
    if (!alreadyAssigned) {
      contract.assignedStaff.push({
        staffId,
        assignedBy: managerId, // Use User ID directly
        assignedAt: new Date(),
        status: 'pending',
        notes: ''
      });
    }

    await contract.save();

    await contract.populate([
      { path: 'customerId', select: 'name email phone role' },
      { path: 'managerId', select: 'name email phone role' },
      { path: 'serviceId', select: 'name price' },
      { path: 'assignedStaff.staffId', select: 'name email phone role' }
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

    // Verify manager and get user ID
    let managerId;
    try {
      managerId = await findOrCreateManager(managerUserId);
    } catch (managerErr) {
      return res.status(403).json({ message: managerErr.message });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if staff exists
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
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
      assignedBy: managerId, // Use User ID directly
      assignedAt: new Date(),
      status: 'pending',
      notes: notes || ''
    });

    await contract.save();

    // Populate assigned staff details
    await contract.populate({
      path: 'assignedStaff.staffId',
      select: 'name email phone employeeId staffRole specialization'
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
    const allStaff = await User.find({ role: 'staff', isActive: true })
      .select('name email phone role employeeId staffRole specialization');
    
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

    // Find staff user
    const staff = await User.findById(staffUserId);
    if (!staff || staff.role !== 'staff') {
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

    const staff = await User.findById(staffUserId);
    if (!staff || staff.role !== 'staff') {
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

    const staff = await User.findById(staffUserId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: "Staff not found" });
    }

    const contracts = await Contract.find({
      'assignedStaff.staffId': staff._id
    })
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role employeeId department')
      .populate('serviceId', 'name price')
      .populate('assignedStaff.staffId', 'name email phone role employeeId staffRole specialization')
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
    const { id } = req.params;
    const customerId = req.userId;

    const contract = await Contract.findById(id)
      .populate('requestId')
      .populate('customerId', 'name email phone role')
      .populate('managerId', 'name email phone role');

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if customer owns this contract
    // Contract.customerId is User ID, so compare directly
    if (contract.customerId.toString() !== customerId.toString()) {
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

// Manager signs contract
const managerSignContract = async (req, res) => {
  try {
    const { id } = req.params;
    const managerUserId = req.userId;

    // Verify manager (no need to get ID, just verify)
    try {
      await findOrCreateManager(managerUserId);
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
      { path: 'customerId', select: 'name email phone role' },
      { path: 'managerId', select: 'name email phone role employeeId department' },
      { path: 'serviceId', select: 'name price' },
      { path: 'assignedStaff.staffId', select: 'name email phone role employeeId staffRole specialization' }
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
    // Contract.customerId is User ID, so compare directly
    if (contract.customerId.toString() !== customerUserId.toString()) {
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
      { path: 'customerId', select: 'name email phone role' },
      { path: 'managerId', select: 'name email phone role employeeId department' },
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
  autoCreateContractFromRequest,
  getContractsForApproval,
  approveContract,
  rejectContract,
  getCustomerContracts,
  getContractProgress,
  getAllContracts,
  getContractById,
  updateContractStatus,
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
