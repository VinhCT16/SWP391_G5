// server/controllers/requestController.js
const Request = require("../models/Request");
const Task = require("../models/Task");
const User = require("../models/User");
const Contract = require("../models/Contract");
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
// Contract creation is now manual - removed autoCreateContractFromRequest import
const { sendApprovalEmail, sendRejectionEmail } = require("../utils/emailService");
const { generateContractPDFBuffer } = require("../utils/pdfGenerator");
// Role-based assignment temporarily disabled
// const { autoAssignStaffToTask } = require("../utils/staffAssignment");

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

// Get customer's requests (by authenticated userId)
const getMyRequests = async (req, res) => {
  try {
    const customerId = req.userId;

    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const requests = await Request.find({ customerId })
      .populate('contractId')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching customer requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// List requests by phone (for ManageRequestsPage)
const listRequestsByPhone = async (req, res) => {
  try {
    let phone = req.query.phone;
    const status = req.query.status;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Normalize phone number: +84xxx -> 0xxx, remove spaces
    phone = String(phone).trim().replace(/\s+/g, "");
    if (phone.startsWith("+84")) {
      phone = "0" + phone.slice(3);
    }

    const query = { customerPhone: phone };
    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests by phone:", err);
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
    
    console.log("📥 [CreateRequest] Received request body keys:", Object.keys(formData || {}));
    console.log("📥 [CreateRequest] Body type:", typeof formData);
    
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
    
    // Check if we have the CreateRequestPage format (customerName, customerPhone, pickupAddress, etc.)
    if (formData.customerName || formData.customerPhone || formData.pickupAddress || formData.deliveryAddress) {
      console.log("📥 [CreateRequest] Detected CreateRequestPage format");
      console.log("📥 [CreateRequest] FormData keys:", Object.keys(formData));
      
      // Handle CreateRequestPage format
      const {
        customerName,
        customerPhone,
        pickupAddress,
        pickupAddressText,
        pickupLocation,
        deliveryAddress,
        deliveryAddressText,
        deliveryLocation,
        movingTime,
        serviceType,
        notes,
        status,
        surveyFee,
        paymentMethod
      } = formData;

      // Validate required fields
      if (!customerName?.trim()) {
        return res.status(400).json({ error: "Customer name is required" });
      }
      if (!customerPhone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      if (!pickupAddress && !pickupAddressText) {
        return res.status(400).json({ error: "Pickup address is required" });
      }
      if (!deliveryAddress && !deliveryAddressText) {
        return res.status(400).json({ error: "Delivery address is required" });
      }
      if (!movingTime) {
        return res.status(400).json({ error: "Moving time is required" });
      }

      // Convert addresses to strings - prefer text version if available
      let fromAddress = pickupAddressText;
      if (!fromAddress || fromAddress.trim() === '') {
        if (typeof pickupAddress === 'string' && pickupAddress.trim()) {
          fromAddress = pickupAddress.trim();
        } else if (pickupAddress && typeof pickupAddress === 'object') {
          // Handle address object with nested name properties
          const parts = [];
          if (pickupAddress.street) parts.push(pickupAddress.street);
          if (pickupAddress.ward?.name) parts.push(pickupAddress.ward.name);
          if (pickupAddress.district?.name) parts.push(pickupAddress.district.name);
          if (pickupAddress.province?.name) parts.push(pickupAddress.province.name);
          fromAddress = parts.filter(p => p && p.trim()).join(', ');
        }
      }
      
      let toAddress = deliveryAddressText;
      if (!toAddress || toAddress.trim() === '') {
        if (typeof deliveryAddress === 'string' && deliveryAddress.trim()) {
          toAddress = deliveryAddress.trim();
        } else if (deliveryAddress && typeof deliveryAddress === 'object') {
          // Handle address object with nested name properties
          const parts = [];
          if (deliveryAddress.street) parts.push(deliveryAddress.street);
          if (deliveryAddress.ward?.name) parts.push(deliveryAddress.ward.name);
          if (deliveryAddress.district?.name) parts.push(deliveryAddress.district.name);
          if (deliveryAddress.province?.name) parts.push(deliveryAddress.province.name);
          toAddress = parts.filter(p => p && p.trim()).join(', ');
        }
      }

      // Validate that we have valid addresses
      if (!fromAddress || fromAddress.trim() === '') {
        console.error("❌ [CreateRequest] fromAddress is empty after conversion");
        return res.status(400).json({ error: "Invalid pickup address format" });
      }
      if (!toAddress || toAddress.trim() === '') {
        console.error("❌ [CreateRequest] toAddress is empty after conversion");
        return res.status(400).json({ error: "Invalid delivery address format" });
      }

      // Map serviceType
      let mappedServiceType = "Local Move";
      if (serviceType === "STANDARD" || serviceType === "Thường") {
        mappedServiceType = "Local Move";
      } else if (serviceType === "Hỏa tốc" || serviceType === "EXPRESS") {
        mappedServiceType = "Long Distance";
      } else if (serviceType === "Commercial") {
        mappedServiceType = "Commercial";
      }

      const moveDate = new Date(movingTime);
      if (isNaN(moveDate.getTime())) {
        return res.status(400).json({ error: "Invalid moving time format" });
      }

      const moveDetails = {
        fromAddress: fromAddress.trim(),
        toAddress: toAddress.trim(),
        moveDate: moveDate,
        serviceType: mappedServiceType,
        phone: customerPhone.trim()
      };

      console.log("✅ [CreateRequest] moveDetails:", {
        fromAddress: moveDetails.fromAddress,
        toAddress: moveDetails.toAddress,
        moveDate: moveDetails.moveDate,
        serviceType: moveDetails.serviceType,
        phone: moveDetails.phone
      });

      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Normalize phone number: +84xxx -> 0xxx, remove spaces
      let normalizedPhone = String(customerPhone).trim().replace(/\s+/g, "");
      if (normalizedPhone.startsWith("+84")) {
        normalizedPhone = "0" + normalizedPhone.slice(3);
      }

      // Build request object
      const requestData = {
        requestId,
        customerId,
        customerName: customerName.trim(), // Store at top level for querying
        customerPhone: normalizedPhone, // Store at top level for querying (normalized)
        moveDetails,
        items: [],
        estimatedPrice: {
          basePrice: 0,
          additionalServices: [],
          totalPrice: 0
        },
        status: status || 'submitted',
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: 'pending'
      };

      // Add surveyFee if provided
      if (surveyFee !== undefined && surveyFee !== null) {
        requestData.surveyFee = surveyFee;
      }

      // Add notes to approval object if provided
      if (notes && notes.trim()) {
        requestData.approval = {
          notes: notes.trim()
        };
      }

      console.log("📤 [CreateRequest] Creating request with data:", {
        requestId,
        customerId,
        moveDetails,
        status: requestData.status,
        surveyFee: requestData.surveyFee
      });

      const request = await Request.create(requestData);

      console.log("✅ [CreateRequest] Request created:", {
        requestId: request.requestId,
        _id: request._id,
        status: request.status,
        statusType: typeof request.status
      });

      // If status is UNDER_SURVEY, automatically create and assign a review task
      if (requestData.status === 'UNDER_SURVEY' || request.status === 'UNDER_SURVEY') {
        console.log("🔄 [CreateRequest] Status is UNDER_SURVEY, calling autoAssignReviewTask...");
        try {
          await autoAssignReviewTask(request._id);
          console.log("✅ [CreateRequest] autoAssignReviewTask completed");
        } catch (taskErr) {
          console.error("❌ [CreateRequest] Error in autoAssignReviewTask:", taskErr);
          // Continue even if task assignment fails - don't block request creation
        }
      } else {
        console.log("ℹ️ [CreateRequest] Status is not UNDER_SURVEY, skipping task creation. Status:", request.status);
      }

      return res.status(201).json(request);
    }

    // Original JSON format handling (moveDetails format)
    console.log("📥 [CreateRequest] Falling through to original format handler");
    console.log("📥 [CreateRequest] formData:", JSON.stringify(formData, null, 2).substring(0, 500));
    
    const { moveDetails, items, estimatedPrice } = formData;

    if (!moveDetails) {
      console.error("❌ [CreateRequest] No moveDetails found and no other format matched");
      console.error("❌ [CreateRequest] Available keys:", Object.keys(formData || {}));
      return res.status(400).json({ 
        error: "Invalid request format. Expected moveDetails or CreateRequestPage format.",
        receivedKeys: Object.keys(formData || {})
      });
    }

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

// Update request (for customers to edit their requests)
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.userId;
    const updateData = req.body;

    // Find the request
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Check if user owns this request
    if (request.customerId.toString() !== customerId) {
      return res.status(403).json({ error: "You can only edit your own requests" });
    }

    // Only allow editing when status is PENDING_CONFIRMATION or PENDING_REVIEW
    const editableStatuses = ["PENDING_CONFIRMATION", "PENDING_REVIEW"];
    if (!editableStatuses.includes(request.status)) {
      return res.status(409).json({ 
        error: `Cannot edit request with status ${request.status}. Only editable when status is PENDING_CONFIRMATION or PENDING_REVIEW` 
      });
    }

    // Update customerName if provided
    if (updateData.customerName !== undefined) {
      if (!String(updateData.customerName || "").trim()) {
        return res.status(400).json({ error: "Customer name is required" });
      }
      request.customerName = String(updateData.customerName).trim();
    }

    // Update customerPhone if provided
    if (updateData.customerPhone !== undefined) {
      // Normalize phone number
      let phone = String(updateData.customerPhone).trim().replace(/\s+/g, "");
      if (phone.startsWith("+84")) {
        phone = "0" + phone.slice(3);
      }
      // Basic validation
      if (!/^0[3-9]\d{8}$/.test(phone)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }
      request.customerPhone = phone;
    }

    // Update moveDetails if provided
    if (updateData.pickupAddress || updateData.deliveryAddress || updateData.movingTime) {
      if (!request.moveDetails) {
        request.moveDetails = {};
      }

      // Convert pickupAddress to string if it's an object
      if (updateData.pickupAddress) {
        let fromAddress = "";
        if (typeof updateData.pickupAddress === 'string') {
          fromAddress = updateData.pickupAddress.trim();
        } else if (typeof updateData.pickupAddress === 'object') {
          const parts = [];
          if (updateData.pickupAddress.street) parts.push(updateData.pickupAddress.street);
          if (updateData.pickupAddress.ward?.name) parts.push(updateData.pickupAddress.ward.name);
          if (updateData.pickupAddress.district?.name) parts.push(updateData.pickupAddress.district.name);
          if (updateData.pickupAddress.province?.name) parts.push(updateData.pickupAddress.province.name);
          fromAddress = parts.filter(p => p && p.trim()).join(', ');
        }
        if (!fromAddress) {
          return res.status(400).json({ error: "Pickup address is required" });
        }
        request.moveDetails.fromAddress = fromAddress;
      }

      // Convert deliveryAddress to string if it's an object
      if (updateData.deliveryAddress) {
        let toAddress = "";
        if (typeof updateData.deliveryAddress === 'string') {
          toAddress = updateData.deliveryAddress.trim();
        } else if (typeof updateData.deliveryAddress === 'object') {
          const parts = [];
          if (updateData.deliveryAddress.street) parts.push(updateData.deliveryAddress.street);
          if (updateData.deliveryAddress.ward?.name) parts.push(updateData.deliveryAddress.ward.name);
          if (updateData.deliveryAddress.district?.name) parts.push(updateData.deliveryAddress.district.name);
          if (updateData.deliveryAddress.province?.name) parts.push(updateData.deliveryAddress.province.name);
          toAddress = parts.filter(p => p && p.trim()).join(', ');
        }
        if (!toAddress) {
          return res.status(400).json({ error: "Delivery address is required" });
        }
        request.moveDetails.toAddress = toAddress;
      }

      // Update movingTime
      if (updateData.movingTime) {
        const moveDate = new Date(updateData.movingTime);
        if (isNaN(moveDate.getTime())) {
          return res.status(400).json({ error: "Invalid moving time format" });
        }
        if (moveDate.getTime() <= Date.now()) {
          return res.status(400).json({ error: "Moving time must be in the future" });
        }
        request.moveDetails.moveDate = moveDate;
      }

      // Update phone in moveDetails if customerPhone was updated
      if (updateData.customerPhone !== undefined && request.moveDetails) {
        request.moveDetails.phone = request.customerPhone;
      }
    }

    // Update locations if provided (optional)
    if (updateData.pickupLocation) {
      // Handle GeoJSON Point format: {type: "Point", coordinates: [lng, lat]}
      if (updateData.pickupLocation.type === "Point" && Array.isArray(updateData.pickupLocation.coordinates)) {
        // Store as is (GeoJSON format)
        request.pickupLocation = updateData.pickupLocation;
      } else if (updateData.pickupLocation.lat && updateData.pickupLocation.lng) {
        // Convert {lat, lng} to GeoJSON
        request.pickupLocation = {
          type: "Point",
          coordinates: [updateData.pickupLocation.lng, updateData.pickupLocation.lat]
        };
      }
    }

    if (updateData.deliveryLocation) {
      if (updateData.deliveryLocation.type === "Point" && Array.isArray(updateData.deliveryLocation.coordinates)) {
        request.deliveryLocation = updateData.deliveryLocation;
      } else if (updateData.deliveryLocation.lat && updateData.deliveryLocation.lng) {
        request.deliveryLocation = {
          type: "Point",
          coordinates: [updateData.deliveryLocation.lng, updateData.deliveryLocation.lat]
        };
      }
    }

    await request.save();

    res.json({
      message: "Request updated successfully",
      request: request
    });
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
    
    // Get customer email for sending notifications
    const customer = await User.findById(request.customerId).select('email name');
    const customerEmail = customer?.email;
    const customerName = customer?.name || request.customerName || 'Customer';
    
    // Note: Contract creation is now manual - manager will create contract after approval
    // This allows manager to fill in contract details (pricing, terms, etc.) before creating
    if (status === 'approved') {
      // Send approval notification email (without contract PDF)
      if (customerEmail) {
        try {
          // Simple approval notification without contract
          console.log('✅ Request approved, sending notification email');
          // You can add a simple approval email function here if needed
        } catch (emailErr) {
          console.error('❌ Error sending approval email:', emailErr);
          // Don't fail the approval if email fails
        }
      } else {
        console.warn('⚠️ Customer email not found, skipping email notification');
      }
    } else if (status === 'rejected' || status === 'denied') {
      // Send rejection email
      if (customerEmail) {
        try {
          await sendRejectionEmail(customerEmail, customerName, request, rejectionReason || 'No specific reason provided.');
          console.log('✅ Rejection email sent successfully');
        } catch (emailErr) {
          console.error('❌ Error sending rejection email:', emailErr);
          // Don't fail the rejection if email fails
        }
      } else {
        console.warn('⚠️ Customer email not found, skipping email notification');
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

// Get staff tasks (requests that staff need to handle)
// This is now handled by Task model - kept for backward compatibility
// Should use /api/tasks/my-tasks instead
const getStaffTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const staffId = req.userId;

    // Get tasks assigned to this staff
    const tasks = await Task.find({
      $or: [
        { assignedStaff: staffId },
        { transporter: staffId }
      ]
    })
    .populate('requestId', 'requestId customerId moveDetails contractId status createdAt')
    .populate('requestId.customerId', 'name email phone')
    .sort({ createdAt: -1 });

    // Filter by request status if provided
    let filteredTasks = tasks;
    if (status) {
      filteredTasks = tasks.filter(task => task.requestId?.status === status);
    }

    // Format as requests for backward compatibility
    const requests = filteredTasks.map(task => ({
      ...task.requestId.toObject(),
      tasks: [{
        taskId: task._id,
        taskType: task.taskType,
        status: task.status,
        assignedStaff: task.assignedStaff,
        transporter: task.transporter
      }]
    }));

    res.json(requests);
  } catch (err) {
    console.error("Error fetching staff tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Auto-assign review task to available staff when request status is UNDER_SURVEY
const autoAssignReviewTask = async (requestId) => {
  try {
    console.log("🔄 [autoAssignReviewTask] Starting for requestId:", requestId);
    
    const request = await Request.findById(requestId);
    if (!request) {
      console.error("❌ [autoAssignReviewTask] Request not found:", requestId);
      return;
    }

    console.log("✅ [autoAssignReviewTask] Request found:", {
      requestId: request.requestId,
      _id: request._id,
      status: request.status
    });

    // Check if review task already exists
    const existingReviewTask = await Task.findOne({ 
      requestId: request._id, 
      taskType: 'Review' 
    });
    if (existingReviewTask) {
      console.log("ℹ️ [autoAssignReviewTask] Review task already exists for request:", requestId, "Task ID:", existingReviewTask._id);
      return;
    }

    // Create review task using Task model (without assignment - staff will pick it)
    const reviewTask = await Task.create({
      requestId: request._id,
      taskType: 'Review',
      assignedStaff: null, // No assignment - staff will pick it
      status: 'pending', // Pending until staff picks it
      estimatedDuration: 2, // 2 hours for review
      priority: 'high',
      description: 'Review and list items for customer request',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      taskHistory: [{
        historyId: new mongoose.Types.ObjectId(),
        status: 'pending',
        notes: 'Review task created automatically for survey request',
        updatedAt: new Date()
      }]
    });

    console.log("✅ [autoAssignReviewTask] Review task created (not assigned):", {
      taskId: reviewTask._id,
      requestId: reviewTask.requestId,
      status: reviewTask.status
    });

    console.log("✅ [autoAssignReviewTask] Review task created successfully (available for staff to pick):", {
      requestId: request.requestId,
      requestObjectId: request._id,
      taskId: reviewTask._id
    });
  } catch (err) {
    console.error("❌ [autoAssignReviewTask] Error:", err);
    console.error("❌ [autoAssignReviewTask] Error stack:", err.stack);
    // Don't throw - this is a background operation, but log the error
  }
};

    // Update request items (for staff review tasks)
const updateRequestItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, taskId, depositPaid } = req.body;
    const staffId = req.userId;

    // Find the request
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Find the review task using Task model
    const reviewTask = await Task.findOne({
      _id: taskId,
      requestId: request._id,
      taskType: 'Review'
    });

    if (!reviewTask) {
      return res.status(404).json({ error: "Review task not found" });
    }

    // Check if staff is assigned to this task
    if (reviewTask.assignedStaff?.toString() !== staffId) {
      return res.status(403).json({ error: "You are not assigned to this review task" });
    }

    // Convert QuoteItemsPage format to Request items format
    // QuoteItemsPage: { name, weight, length, width, height, images, isApartment }
    // Request items: { itemId, description, quantity, category, estimatedValue, requiresSpecialHandling }
    const requestItems = items.map(item => ({
      itemId: new mongoose.Types.ObjectId(),
      description: item.name || '',
      quantity: 1, // Default to 1, can be enhanced later
      category: 'other', // Default category
      estimatedValue: null,
      requiresSpecialHandling: item.isApartment || false,
      // Store additional data in a flexible way
      dimensions: {
        weight: item.weight ? parseFloat(item.weight) : null,
        length: item.length ? parseFloat(item.length) : null,
        width: item.width ? parseFloat(item.width) : null,
        height: item.height ? parseFloat(item.height) : null
      },
      images: item.images || []
    }));

    // Update request items
    request.items = requestItems;

    // Handle deposit payment if provided (for cash payments)
    if (depositPaid !== undefined && request.paymentMethod === 'cash') {
      request.depositPaid = depositPaid;
      if (depositPaid) {
        request.depositPaidAt = new Date();
        request.depositPaidBy = staffId;
        request.paymentStatus = 'deposit_paid';
      }
    }

    // Update task status to in-progress if it's still assigned
    if (reviewTask.status === 'assigned') {
      reviewTask.status = 'in-progress';
      reviewTask.taskHistory.push({
        historyId: new mongoose.Types.ObjectId(),
        status: 'in-progress',
        notes: depositPaid ? 'Started reviewing items and marked deposit as paid' : 'Started reviewing items',
        updatedBy: staffId,
        updatedAt: new Date()
      });
      await reviewTask.save();
    }

    await request.save();

    res.json({
      message: "Request items updated successfully",
      request: request
    });
  } catch (err) {
    console.error("Error updating request items:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Cancel request (for customers)
const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.userId;

    // Find the request
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Check if user owns this request
    if (request.customerId.toString() !== customerId) {
      return res.status(403).json({ error: "You can only cancel your own requests" });
    }

    // Only allow canceling when status allows it
    const canCancelStatuses = [
      "PENDING_CONFIRMATION",
      "UNDER_SURVEY",
      "WAITING_PAYMENT",
      "PENDING_REVIEW", // Backward compat
      "APPROVED", // Backward compat
    ];

    if (!canCancelStatuses.includes(request.status)) {
      return res.status(409).json({ 
        error: `Cannot cancel request with status ${request.status}. Only cancellable when status is: ${canCancelStatuses.join(", ")}` 
      });
    }

    // Update status to CANCELLED
    request.status = "CANCELLED";
    await request.save();

    res.json({
      message: "Request cancelled successfully",
      request: request
    });
  } catch (err) {
    console.error("Error cancelling request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
  assignStaffToRequest,
  getStaffTasks,
  updateRequest,
  cancelRequest,
  updateRequestItems
};

