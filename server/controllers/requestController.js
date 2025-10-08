const Request = require("../models/Request");
const Service = require("../models/Service");
const { v4: uuidv4 } = require('uuid');

// Generate unique request ID
const generateRequestId = () => `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create a new moving request
const createRequest = async (req, res) => {
  try {
    const { moveDetails, items, estimatedPrice } = req.body;
    const customerId = req.userId;

    // Validate required fields
    if (!moveDetails || !moveDetails.fromAddress || !moveDetails.toAddress || !moveDetails.moveDate) {
      return res.status(400).json({ 
        message: "Move details (fromAddress, toAddress, moveDate) are required" 
      });
    }

    // Create the request
    const requestData = {
      requestId: generateRequestId(),
      customerId,
      moveDetails: {
        fromAddress: moveDetails.fromAddress,
        toAddress: moveDetails.toAddress,
        moveDate: new Date(moveDetails.moveDate),
        serviceType: moveDetails.serviceType || "Local Move",
        phone: moveDetails.phone
      },
      items: items || [],
      estimatedPrice: estimatedPrice || {
        basePrice: 0,
        additionalServices: [],
        totalPrice: 0
      },
      status: "submitted"
    };

    const request = await Request.create(requestData);
    
    // Populate customer details
    await request.populate('customerId', 'name email phone');
    
    res.status(201).json({
      message: "Request submitted successfully",
      request: {
        id: request._id,
        requestId: request.requestId,
        status: request.status,
        moveDetails: request.moveDetails,
        estimatedPrice: request.estimatedPrice,
        createdAt: request.createdAt
      }
    });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all requests for a customer
const getCustomerRequests = async (req, res) => {
  try {
    const customerId = req.userId;
    const requests = await Request.find({ customerId })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a specific request
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id)
      .populate('customerId', 'name email phone')
      .populate('contractId');

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user owns this request or is a manager/staff
    if (request.customerId._id.toString() !== req.userId && !['manager', 'staff'].includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ request });
  } catch (err) {
    console.error("Error fetching request:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update request status (for managers)
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, notes } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    request.status = status;
    
    if (status === 'rejected' && rejectionReason) {
      request.approval = {
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        approved: false,
        rejectionReason,
        notes
      };
    } else if (status === 'approved') {
      request.approval = {
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        approved: true,
        notes
      };
    }

    await request.save();
    
    res.json({
      message: "Request status updated successfully",
      request: {
        id: request._id,
        requestId: request.requestId,
        status: request.status,
        approval: request.approval
      }
    });
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all requests (for managers)
const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await Request.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments(filter);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRequest,
  getCustomerRequests,
  getRequestById,
  updateRequestStatus,
  getAllRequests
};
