// server/controllers/requestController.js
const Request = require("../models/Request");
const User = require("../models/User");
const { v4: uuidv4 } = require('uuid');
const { autoCreateContractFromRequest } = require("./contractController");

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

// Create request (customer)
const createRequest = async (req, res) => {
  try {
    const customerId = req.userId;
    
    // Handle both JSON and FormData
    let formData = req.body;
    let imageFiles = [];
    
    // If FormData, extract fields and files
    if (req.files && req.files.length > 0) {
      imageFiles = req.files.map(file => ({
        name: file.originalname,
        url: file.path || file.buffer?.toString('base64') || '',
        uploadedAt: new Date()
      }));
    }
    
    // Check if we have the new simple form format (name, phone, address, deliveryTime, serviceType, notes)
    if (formData.name || formData.phone || formData.address || formData.deliveryTime) {
      // Validate required fields
      if (!formData.phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      if (!formData.address) {
        return res.status(400).json({ error: "Address is required" });
      }
      if (!formData.deliveryTime) {
        return res.status(400).json({ error: "Delivery time is required" });
      }
      
      // Map simple form to expected structure
      const moveDate = new Date(formData.deliveryTime);
      if (isNaN(moveDate.getTime())) {
        return res.status(400).json({ error: "Invalid delivery time format" });
      }
      
      // Map serviceType: "Thường" -> "Local Move", "Hỏa tốc" -> "Long Distance"
      let serviceType = "Local Move";
      if (formData.serviceType === "Hỏa tốc") {
        serviceType = "Long Distance";
      } else if (formData.serviceType === "Commercial") {
        serviceType = "Commercial";
      }
      
      // For now, use the same address for both fromAddress and toAddress
      // TODO: Update form to collect separate pickup and delivery addresses
      const address = formData.address.trim();
      
      const moveDetails = {
        fromAddress: address,
        toAddress: address, // Using same address for now - should be updated in form
        moveDate: moveDate,
        serviceType: serviceType,
        phone: formData.phone.trim()
      };
      
      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Build request object
      const requestData = {
        requestId,
        customerId,
        moveDetails,
        items: [],
        estimatedPrice: {
          basePrice: 0,
          additionalServices: [],
          totalPrice: 0
        },
        status: 'submitted'
      };
      
      // Add notes to approval object if provided
      if (formData.notes && formData.notes.trim()) {
        requestData.approval = {
          notes: formData.notes.trim()
        };
      }
      
      const request = await Request.create(requestData);
      
      return res.status(201).json({
        message: "Request created successfully",
        request: request
      });
    }
    
    // Original JSON format handling
    const { moveDetails, items, estimatedPrice } = formData;

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
    res.status(500).json({ message: "Server error", error: err.message });
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
// Handles both requestId and id parameters
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId, id } = req.params;
    const { status, rejectionReason, notes } = req.body;
    const managerId = req.userId;

    // Support both requestId and id parameter names
    const request = await Request.findById(requestId || id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    request.status = status;
    
    if (status === 'rejected' && rejectionReason) {
      request.approval = {
        reviewedBy: managerId,
        reviewedAt: new Date(),
        approved: false,
        rejectionReason,
        notes: notes || ''
      };
    } else if (status === 'approved') {
      request.approval = {
        reviewedBy: managerId,
        reviewedAt: new Date(),
        approved: true,
        notes: notes || ''
      };
    } else {
      // For other statuses, update approval if provided
      request.approval = {
        reviewedBy: managerId,
        reviewedAt: new Date(),
        approved: status === 'approved',
        rejectionReason: rejectionReason || '',
        notes: notes || ''
      };
    }

    await request.save();
    
    // Automatically create contract when request is approved
    if (status === 'approved') {
      try {
        console.log('Request approved, automatically creating contract...');
        const contract = await autoCreateContractFromRequest(request._id, managerId);
        console.log('Contract created automatically:', contract._id);
      } catch (contractErr) {
        // Log error but don't fail the request approval
        console.error('Error automatically creating contract:', contractErr);
        // Contract creation can be done manually later if automatic creation fails
      }
    }
    
    res.json({
      message: `Request ${status} successfully`,
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

// Get available staff for a request (Manager)
const getAvailableStaffForRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const allStaff = await User.find({ role: 'staff', isActive: true }).select('name email phone employeeId staffRole specialization');
    const assignedIds = (request.assignedStaff || []).map(a => a.staffId.toString());
    const availableStaff = allStaff.filter(s => !assignedIds.includes(s._id.toString()));
    return res.json({ availableStaff });
  } catch (err) {
    console.error('Error getting available staff:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Assign staff to request (Manager)
const assignStaffToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, notes } = req.body;
    const managerId = req.userId;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const exists = (request.assignedStaff || []).some(a => a.staffId.toString() === staffId);
    if (!exists) {
      request.assignedStaff.push({ staffId, assignedBy: managerId, assignedAt: new Date(), notes: notes || '' });
      await request.save();
    }

    await request.populate({
      path: 'assignedStaff.staffId',
      select: 'name email phone employeeId staffRole specialization'
    });

    return res.json({ message: 'Staff assigned to request', request });
  } catch (err) {
    console.error('Error assigning staff to request:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllRequests,
  getMyRequests,
  updateRequestStatus,
  createRequest,
  getCustomerRequests,
  getRequestById,
  getAvailableStaffForRequest,
  assignStaffToRequest
};

