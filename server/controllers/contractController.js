const Contract = require("../models/Contract");
const Request = require("../models/Request");
const Service = require("../models/Service");
const { v4: uuidv4 } = require('uuid');

// Generate unique contract ID
const generateContractId = () => `CON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create contract from approved request
const createContractFromRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { serviceId, pricing, paymentMethod } = req.body;
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

    // Create contract
    const contractData = {
      contractId: generateContractId(),
      requestId: request._id,
      customerId: request.customerId,
      managerId,
      serviceId,
      moveDetails: request.moveDetails,
      pricing: {
        basePrice: pricing.basePrice || service.price,
        additionalServices: pricing.additionalServices || [],
        totalPrice: pricing.totalPrice || service.price,
        deposit: pricing.deposit || 0,
        balance: (pricing.totalPrice || service.price) - (pricing.deposit || 0)
      },
      paymentMethod: {
        type: paymentMethod.type || 'cash',
        details: paymentMethod.details || {}
      },
      status: 'draft'
    };

    const contract = await Contract.create(contractData);

    // Update request with contract reference
    request.contractId = contract._id;
    request.status = 'contract_created';
    await request.save();

    // Populate contract details
    await contract.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'managerId', select: 'userId' },
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
    res.status(500).json({ message: "Server error" });
  }
};

// Get contract by ID
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id)
      .populate('customerId', 'name email phone')
      .populate('managerId', 'userId')
      .populate('serviceId', 'name price');

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

// Get all contracts
const getAllContracts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

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
    console.error("Error fetching contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createContractFromRequest,
  getContractById,
  updateContractStatus,
  getAllContracts
};
