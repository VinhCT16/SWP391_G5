// server/controllers/requestController.js
const Request = require("../models/Request");
const { v4: uuidv4 } = require('uuid');

// Get all requests (manager view)
const getAllRequests = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { 'moveDetails.fromAddress': { $regex: search, $options: 'i' } },
        { 'moveDetails.toAddress': { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await Request.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get customer's requests
const getMyRequests = async (req, res) => {
  try {
    const customerId = req.userId;

    const requests = await Request.find({ customerId })
      .populate('contractId')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching customer requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update request status (manager)
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason, notes } = req.body;
    const managerId = req.userId;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    request.status = status;
    request.approval = {
      reviewedBy: managerId,
      reviewedAt: new Date(),
      approved: status === 'approved',
      rejectionReason: rejectionReason || '',
      notes: notes || ''
    };

    await request.save();

    res.json({
      message: `Request ${status} successfully`,
      request: request
    });
  } catch (err) {
    console.error("Error updating request status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create request (customer)
const createRequest = async (req, res) => {
  try {
    const { moveDetails, items, estimatedPrice } = req.body;
    const customerId = req.userId;

    // Generate unique request ID
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const request = await Request.create({
      requestId,
      customerId,
      moveDetails,
      items: items || [],
      estimatedPrice: estimatedPrice || {
        basePrice: 0,
        additionalServices: [],
        totalPrice: 0
      },
      status: 'submitted'
    });

    res.status(201).json({
      message: "Request created successfully",
      request: request
    });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllRequests,
  getMyRequests,
  updateRequestStatus,
  createRequest
};

