const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const {
  createVNPayPayment,
  handleVNPayReturn,
  handleVNPayIPN,
} = require('../controllers/paymentController');

// Create VNPay payment URL (requires authentication)
router.post('/vnpay/create', auth, createVNPayPayment);

// VNPay return URL (no auth required - called by VNPay)
router.get('/vnpay/return', handleVNPayReturn);

// VNPay IPN (Instant Payment Notification) - no auth required
router.get('/vnpay/ipn', handleVNPayIPN);
router.post('/vnpay/ipn', handleVNPayIPN);

module.exports = router;

