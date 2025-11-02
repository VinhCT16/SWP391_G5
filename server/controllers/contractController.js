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

    // Create contract
    const contract = await Contract.create({
      contractId: uuidv4(),
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
      terms: {
        liability: terms.liability || "Standard moving liability coverage",
        cancellation: terms.cancellation || "24-hour notice required for cancellation",
        additionalTerms: terms.additionalTerms || ""
      },
      status: 'draft'
    });

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

    const contracts = await Contract.find({ customerId })
      .populate('requestId', 'requestId moveDetails')
      .populate('managerId', 'name email')
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
  getCustomerContracts,
  getContractProgress
};