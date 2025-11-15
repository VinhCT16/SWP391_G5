const Request = require('../models/Request');
const { createPaymentUrl, verifyPaymentCallback, getResponseMessage } = require('../utils/vnpay');

/**
 * Create VNPay payment URL for a request
 * POST /api/payments/vnpay/create
 */
const createVNPayPayment = async (req, res) => {
  try {
    console.log('🔵 [VNPay] Creating payment URL request received:', {
      requestId: req.body?.requestId,
      customerId: req.userId,
      hasBody: !!req.body
    });

    const { requestId } = req.body;
    const customerId = req.userId;

    if (!requestId) {
      console.error('❌ [VNPay] Missing requestId in request body');
      return res.status(400).json({ error: 'Request ID is required' });
    }

    if (!customerId) {
      console.error('❌ [VNPay] Missing customerId (not authenticated)');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      console.error('❌ [VNPay] Request not found:', requestId);
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('✅ [VNPay] Request found:', {
      requestId: request._id,
      requestNumber: request.requestId,
      paymentMethod: request.paymentMethod,
      customerId: request.customerId?.toString(),
      requestCustomerId: request.customerId?.toString(),
      authCustomerId: customerId.toString()
    });

    // Verify customer owns this request
    if (request.customerId.toString() !== customerId.toString()) {
      console.error('❌ [VNPay] Access denied - customer mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if payment method is online_banking
    if (request.paymentMethod !== 'online_banking') {
      console.error('❌ [VNPay] Payment method mismatch:', {
        expected: 'online_banking',
        actual: request.paymentMethod
      });
      return res.status(400).json({ error: 'This request is not set for online banking payment' });
    }

    // Calculate amount (survey fee + estimated price or deposit)
    let amount = 0;
    if (request.surveyFee) {
      amount += Number(request.surveyFee) || 0;
    }
    if (request.estimatedPrice?.totalPrice) {
      // For deposit, use 30% of total price, or full amount if already approved
      if (request.status === 'approved' || request.status === 'contract_created') {
        amount += Number(request.estimatedPrice.totalPrice) || 0;
      } else {
        // Deposit: 30% of estimated price
        amount += Math.round((Number(request.estimatedPrice.totalPrice) || 0) * 0.3);
      }
    }

    // If no amount calculated, use minimum amount for testing (1000 VND = 10,000 cents)
    if (amount <= 0) {
      console.warn('⚠️ [VNPay] No amount calculated, using minimum test amount');
      amount = 1000; // 1000 VND minimum
    }

    // Get customer IP address (handle various proxy headers)
    let ipAddr = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                 req.headers['x-real-ip'] ||
                 req.connection?.remoteAddress ||
                 req.socket?.remoteAddress ||
                 req.ip ||
                 '127.0.0.1';
    
    // Clean IP address (remove IPv6 prefix if present)
    if (ipAddr.includes('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }
    // Default to localhost if invalid
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ipAddr)) {
      ipAddr = '127.0.0.1';
    }

    // Ensure requestId is valid for VNPay (alphanumeric, underscore, hyphen, max 100 chars)
    // VNPay vnp_TxnRef: alphanumeric, underscore, hyphen only, max 100 characters
    let orderId = String(request.requestId || request._id.toString());
    // Remove all special characters except underscore and hyphen, limit to 100 chars
    orderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
    
    // If orderId is empty or too short after sanitization, generate a safe one
    if (!orderId || orderId.length < 5) {
      // Generate: REQ + last 12 chars of ObjectId (remove special chars) + last 6 digits of timestamp
      const objIdStr = request._id.toString().replace(/[^a-zA-Z0-9]/g, '').slice(-12);
      const timestamp = Date.now().toString().slice(-6);
      orderId = `REQ${objIdStr}${timestamp}`.substring(0, 100);
      console.log(`⚠️ [VNPay] Generated safe orderId: ${orderId} (original: ${request.requestId})`);
    } else if (orderId !== request.requestId) {
      console.log(`⚠️ [VNPay] Sanitized orderId: ${request.requestId} -> ${orderId}`);
    }

    try {
      // Create payment URL
      const paymentUrl = createPaymentUrl({
        orderId: orderId,
        amount: amount,
        orderDescription: `Thanh toan don hang ${orderId}`,
        orderType: 'other',
        locale: 'vn',
        ipAddr: ipAddr
      });

      // Update request payment status
      request.paymentStatus = 'pending';
      await request.save();

      console.log('✅ [VNPay] Payment URL created successfully:', {
        requestId: request._id,
        orderId: orderId,
        amount: amount
      });

      res.json({
        paymentUrl,
        amount,
        requestId: request.requestId,
        orderId: orderId
      });
    } catch (vnpayError) {
      console.error('❌ [VNPay] Error creating payment URL:', {
        error: vnpayError.message,
        stack: vnpayError.stack,
        name: vnpayError.name
      });
      return res.status(500).json({ 
        error: 'Failed to create payment URL', 
        message: vnpayError.message,
        details: process.env.NODE_ENV === 'development' ? vnpayError.stack : undefined
      });
    }
  } catch (err) {
    console.error('❌ [VNPay] Unexpected error in createVNPayPayment:', {
      error: err.message,
      stack: err.stack,
      name: err.name,
      requestId: req.body?.requestId
    });
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * Handle VNPay payment callback
 * GET /api/payments/vnpay/return
 */
const handleVNPayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;

    // Verify payment callback
    const verification = verifyPaymentCallback({ ...vnp_Params });
    
    // Find request by orderId (requestId)
    const request = await Request.findOne({ requestId: verification.orderId });
    
    if (!request) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/failed?message=Request not found`);
    }

    if (!verification.isValid) {
      console.error('VNPay callback verification failed:', verification);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/failed?message=Invalid payment signature`);
    }

    // Check response code
    if (verification.responseCode === '00') {
      // Payment successful
      request.paymentStatus = 'deposit_paid';
      request.depositPaid = true;
      request.depositPaidAt = new Date();
      request.vnpayTransaction = {
        transactionId: verification.transactionId,
        amount: verification.amount,
        orderInfo: verification.orderInfo,
        paymentDate: verification.payDate ? new Date(verification.payDate) : new Date(),
        responseCode: verification.responseCode,
        transactionStatus: 'success'
      };
      await request.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/payment/success?requestId=${request.requestId}`);
    } else {
      // Payment failed
      request.paymentStatus = 'not_paid';
      request.vnpayTransaction = {
        transactionId: verification.transactionId || null,
        amount: verification.amount,
        orderInfo: verification.orderInfo,
        paymentDate: new Date(),
        responseCode: verification.responseCode,
        transactionStatus: 'failed'
      };
      await request.save();

      const errorMessage = getResponseMessage(verification.responseCode);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/payment/failed?message=${encodeURIComponent(errorMessage)}&requestId=${request.requestId}`);
    }
  } catch (err) {
    console.error('❌ [VNPay] Error handling VNPay return:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/payment/failed?message=${encodeURIComponent('Server error: ' + err.message)}`);
  }
};

/**
 * Handle VNPay IPN (Instant Payment Notification)
 * POST /api/payments/vnpay/ipn
 */
const handleVNPayIPN = async (req, res) => {
  try {
    const vnp_Params = req.query;

    // Verify payment callback
    const verification = verifyPaymentCallback({ ...vnp_Params });
    
    // Find request by orderId (requestId)
    const request = await Request.findOne({ requestId: verification.orderId });
    
    if (!request) {
      return res.status(200).json({ RspCode: '01', Message: 'Request not found' });
    }

    if (!verification.isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    // Check if transaction already processed
    if (request.vnpayTransaction?.transactionId === verification.transactionId && 
        request.paymentStatus === 'deposit_paid') {
      return res.status(200).json({ RspCode: '00', Message: 'Transaction already processed' });
    }

    // Check response code
    if (verification.responseCode === '00') {
      // Payment successful
      request.paymentStatus = 'deposit_paid';
      request.depositPaid = true;
      request.depositPaidAt = new Date();
      request.vnpayTransaction = {
        transactionId: verification.transactionId,
        amount: verification.amount,
        orderInfo: verification.orderInfo,
        paymentDate: verification.payDate ? new Date(verification.payDate) : new Date(),
        responseCode: verification.responseCode,
        transactionStatus: 'success'
      };
      await request.save();

      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      // Payment failed
      request.paymentStatus = 'not_paid';
      request.vnpayTransaction = {
        transactionId: verification.transactionId || null,
        amount: verification.amount,
        orderInfo: verification.orderInfo,
        paymentDate: new Date(),
        responseCode: verification.responseCode,
        transactionStatus: 'failed'
      };
      await request.save();

      return res.status(200).json({ RspCode: '00', Message: 'Payment failed' });
    }
  } catch (err) {
    console.error('Error handling VNPay IPN:', err);
    return res.status(200).json({ RspCode: '99', Message: 'Server error' });
  }
};

module.exports = {
  createVNPayPayment,
  handleVNPayReturn,
  handleVNPayIPN,
};

