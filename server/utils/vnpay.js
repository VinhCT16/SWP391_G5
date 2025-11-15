const crypto = require('crypto');
const querystring = require('querystring');

// VNPay Configuration
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || '',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || '',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/payments/vnpay/return',
  vnp_Api: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
};

/**
 * Create VNPay payment URL
 * @param {Object} params - Payment parameters
 * @param {String} params.orderId - Order ID (request ID)
 * @param {Number} params.amount - Amount in VND
 * @param {String} params.orderDescription - Order description
 * @param {String} params.orderType - Order type
 * @param {String} params.locale - Locale (vn/en)
 * @param {String} params.ipAddr - Customer IP address
 * @returns {String} VNPay payment URL
 */
function createPaymentUrl(params) {
  const {
    orderId,
    amount,
    orderDescription = 'Thanh toan don hang',
    orderType = 'other',
    locale = 'vn',
    ipAddr = '127.0.0.1'
  } = params;

  // Validate required configuration
  if (!VNPAY_CONFIG.vnp_TmnCode || VNPAY_CONFIG.vnp_TmnCode.trim() === '') {
    console.error('❌ [VNPay] VNPAY_TMN_CODE is not configured in environment variables');
    throw new Error('VNPAY_TMN_CODE is not configured. Please set VNPAY_TMN_CODE in your .env file.');
  }
  
  const hashSecret = VNPAY_CONFIG.vnp_HashSecret ? VNPAY_CONFIG.vnp_HashSecret.trim() : '';
  if (!hashSecret || hashSecret === '') {
    console.error('❌ [VNPay] VNPAY_HASH_SECRET is not configured in environment variables');
    throw new Error('VNPAY_HASH_SECRET is not configured. Please set VNPAY_HASH_SECRET in your .env file.');
  }
  
  if (hashSecret.length < 10) {
    console.error('❌ [VNPay] VNPAY_HASH_SECRET is too short:', hashSecret.length);
    throw new Error('VNPAY_HASH_SECRET appears to be invalid (too short). Please verify it in your .env file.');
  }
  
  // Check for common Hash Secret issues
  if (hashSecret.includes(' ')) {
    console.error('❌ [VNPay] VNPAY_HASH_SECRET contains spaces! This will cause signature errors.');
    throw new Error('VNPAY_HASH_SECRET contains spaces. Remove all spaces from the Hash Secret in your .env file.');
  }
  
  // Validate TMN Code format (typically 8 characters for sandbox)
  const tmnCode = VNPAY_CONFIG.vnp_TmnCode.trim();
  
  // Check for common issues
  if (tmnCode.length === 0) {
    throw new Error('VNPAY_TMN_CODE is empty. Please set it in your .env file.');
  }
  if (tmnCode.length < 6 || tmnCode.length > 20) {
    console.warn('⚠️ [VNPay] TMN Code length is unusual:', tmnCode.length, 'Expected: 6-20 characters. Your TMN Code might be incorrect.');
  }
  if (tmnCode.includes(' ')) {
    console.error('❌ [VNPay] TMN Code contains spaces! This will cause "terminal not found" error. Remove spaces from VNPAY_TMN_CODE in .env file.');
    throw new Error('VNPAY_TMN_CODE contains spaces. Please remove all spaces from the TMN Code.');
  }
  
  // Log the actual TMN Code (first 2 and last 2 characters) for debugging
  const maskedTmnForLog = tmnCode.length > 4 
    ? `${tmnCode.substring(0, 2)}***${tmnCode.substring(tmnCode.length - 2)}`
    : '****';
  console.log('🔍 [VNPay] TMN Code being used:', {
    masked: maskedTmnForLog,
    length: tmnCode.length,
    hasSpaces: tmnCode.includes(' '),
    trimmed: tmnCode === VNPAY_CONFIG.vnp_TmnCode
  });
  
  // Log configuration (mask sensitive data)
  const maskedHashSecret = hashSecret.length > 8
    ? hashSecret.substring(0, 4) + '***' + hashSecret.substring(hashSecret.length - 4)
    : '****';
  
  console.log('✅ [VNPay] Configuration validated:', {
    tmnCode: maskedTmnForLog,
    tmnCodeLength: tmnCode.length,
    hasHashSecret: hashSecret.length > 0,
    hashSecretLength: hashSecret.length,
    hashSecretMasked: maskedHashSecret,
    isSandbox: VNPAY_CONFIG.vnp_Url.includes('sandbox'),
    returnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    paymentUrl: VNPAY_CONFIG.vnp_Url
  });
  
  // Important warnings
  if (VNPAY_CONFIG.vnp_Url.includes('sandbox') && !tmnCode.toLowerCase().includes('test')) {
    console.warn('⚠️ [VNPay] Using sandbox URL but TMN Code format suggests it might not be a sandbox code.');
    console.warn('⚠️ [VNPay] Make sure you registered at http://sandbox.vnpayment.vn/devreg/ and got a sandbox TMN Code.');
    console.warn('⚠️ [VNPay] If you see "terminal not found" error, verify the TMN Code in VNPay merchant portal.');
  }
  
  // Validate return URL format
  if (!VNPAY_CONFIG.vnp_ReturnUrl || !VNPAY_CONFIG.vnp_ReturnUrl.startsWith('http')) {
    throw new Error('Invalid VNPAY_RETURN_URL: must be a valid HTTP/HTTPS URL');
  }
  
  // Warn if return URL points to frontend instead of backend
  if (VNPAY_CONFIG.vnp_ReturnUrl.includes('/payment/') && !VNPAY_CONFIG.vnp_ReturnUrl.includes('/api/payments/')) {
    console.error('❌ [VNPay] Return URL points to frontend! This is incorrect.');
    console.error('❌ [VNPay] VNPay return URL must point to backend API endpoint.');
    console.error('❌ [VNPay] Current: ' + VNPAY_CONFIG.vnp_ReturnUrl);
    console.error('❌ [VNPay] Should be: http://localhost:3000/api/payments/vnpay/return');
    console.error('❌ [VNPay] Update VNPAY_RETURN_URL in your .env file and restart server.');
  }

  // Validate and sanitize orderId (vnp_TxnRef)
  // VNPay requires: max 100 characters, alphanumeric and some special chars
  const sanitizedOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
  if (!sanitizedOrderId || sanitizedOrderId.length === 0) {
    throw new Error('Invalid orderId: must be alphanumeric');
  }

  // Validate amount
  const amountInVND = Math.round(Number(amount));
  if (isNaN(amountInVND) || amountInVND <= 0) {
    throw new Error('Invalid amount: must be a positive number');
  }
  // VNPay expects amount in cents (smallest currency unit)
  const amountInCents = amountInVND * 100;

  // Format dates: VNPay expects YYYYMMDDHHmmss format (14 digits, Vietnam time UTC+7)
  // Get current date/time
  const now = new Date();
  
  // Convert to Vietnam time (UTC+7) - add 7 hours
  const vietnamTimeMs = now.getTime() + (7 * 60 * 60 * 1000);
  const vietnamDate = new Date(vietnamTimeMs);
  
  // Format: YYYYMMDDHHmmss
  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
  const hours = String(vietnamDate.getUTCHours()).padStart(2, '0');
  const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(vietnamDate.getUTCSeconds()).padStart(2, '0');
  const createDate = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // Expire date: 15 minutes from now
  const expireTimeMs = vietnamTimeMs + (15 * 60 * 1000);
  const expireDateObj = new Date(expireTimeMs);
  const expireYear = expireDateObj.getUTCFullYear();
  const expireMonth = String(expireDateObj.getUTCMonth() + 1).padStart(2, '0');
  const expireDay = String(expireDateObj.getUTCDate()).padStart(2, '0');
  const expireHours = String(expireDateObj.getUTCHours()).padStart(2, '0');
  const expireMinutes = String(expireDateObj.getUTCMinutes()).padStart(2, '0');
  const expireSeconds = String(expireDateObj.getUTCSeconds()).padStart(2, '0');
  const expireDate = `${expireYear}${expireMonth}${expireDay}${expireHours}${expireMinutes}${expireSeconds}`;
  
  // Validate date format
  if (createDate.length !== 14 || expireDate.length !== 14 || !/^\d{14}$/.test(createDate) || !/^\d{14}$/.test(expireDate)) {
    throw new Error(`Invalid date format: createDate=${createDate}, expireDate=${expireDate}`);
  }

  // Sanitize order description (remove special characters that might cause issues)
  const sanitizedOrderDescription = String(orderDescription)
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 255); // Max 255 characters

  // Validate IP address format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const validIpAddr = ipRegex.test(ipAddr) ? ipAddr : '127.0.0.1';

  // Build VNPay parameters (must be in alphabetical order for signing)
  // IMPORTANT: Use trimmed TMN Code to avoid whitespace issues
  const vnp_TmnCode = VNPAY_CONFIG.vnp_TmnCode.trim();
  
  const vnp_Params = {
    vnp_Amount: String(amountInCents),
    vnp_Command: 'pay',
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_ExpireDate: expireDate,
    vnp_IpAddr: validIpAddr,
    vnp_Locale: locale,
    vnp_OrderInfo: sanitizedOrderDescription,
    vnp_OrderType: orderType,
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_TmnCode: vnp_TmnCode, // Use trimmed version
    vnp_TxnRef: sanitizedOrderId,
    vnp_Version: '2.1.0',
  };
  
  // Log the parameters being sent (mask sensitive data)
  console.log('📤 [VNPay] Payment parameters:', {
    vnp_Amount: amountInCents,
    vnp_Command: 'pay',
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_ExpireDate: expireDate,
    vnp_IpAddr: validIpAddr,
    vnp_Locale: locale,
    vnp_OrderInfo: sanitizedOrderDescription.substring(0, 50) + '...',
    vnp_OrderType: orderType,
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_TmnCode: vnp_TmnCode.substring(0, 2) + '***' + vnp_TmnCode.substring(vnp_TmnCode.length - 2),
    vnp_TxnRef: sanitizedOrderId,
    vnp_Version: '2.1.0',
  });

  // Create query string for signing
  // VNPay signature requirements:
  // 1. Exclude empty parameters
  // 2. Sort parameters alphabetically
  // 3. Format: key1=value1&key2=value2 (no URL encoding for signature)
  // 4. Hash with SHA512 using Hash Secret
  
  // Filter out empty parameters and sort alphabetically
  const paramsForSigning = {};
  Object.keys(vnp_Params)
    .sort() // Sort alphabetically
    .forEach(key => {
      const value = vnp_Params[key];
      // Only include non-empty parameters
      if (value !== null && value !== undefined && value !== '') {
        paramsForSigning[key] = String(value);
      }
    });
  
  // Build sign data string: key1=value1&key2=value2
  // IMPORTANT: Do NOT URL encode the values for signature calculation
  const signData = Object.keys(paramsForSigning)
    .map(key => `${key}=${paramsForSigning[key]}`)
    .join('&');
  
  console.log('🔐 [VNPay] Sign data (full):', signData);
  console.log('🔐 [VNPay] Parameters for signing:', Object.keys(paramsForSigning).join(', '));
  console.log('🔐 [VNPay] Sign data length:', signData.length);
  
  // Create secure hash using SHA512
  // VNPay uses HMAC-SHA512 with the Hash Secret
  // Use the hashSecret variable that was validated at the top of the function
  const hmac = crypto.createHmac('sha512', hashSecret);
  hmac.update(signData, 'utf8');
  // VNPay expects lowercase hex for signature
  const vnp_SecureHash = hmac.digest('hex').toLowerCase();
  
  console.log('🔐 [VNPay] Signature calculation:', {
    signDataLength: signData.length,
    hashSecretLength: hashSecret.length,
    hashAlgorithm: 'SHA512',
    hashFormat: 'hex (lowercase)',
    hashLength: vnp_SecureHash.length
  });
  
  console.log('🔐 [VNPay] Secure hash created:', vnp_SecureHash.substring(0, 20) + '...');
  console.log('🔐 [VNPay] Hash Secret length:', hashSecret.length);
  
  // Add secure hash to params (must be added AFTER signing, not included in sign data)
  vnp_Params.vnp_SecureHash = vnp_SecureHash;

  // Build payment URL - VNPay expects URL-encoded parameters
  // Note: Some parameters may need special encoding
  const queryString = querystring.stringify(vnp_Params);
  const paymentUrl = VNPAY_CONFIG.vnp_Url + '?' + queryString;
  
  // Validate URL length (VNPay has URL length limits)
  if (paymentUrl.length > 2000) {
    console.warn('⚠️ [VNPay] Payment URL is very long:', paymentUrl.length, 'characters');
  }
  
  // Log the final URL (without query string for security)
  console.log('🔗 [VNPay] Payment URL created successfully:', {
    orderId: sanitizedOrderId,
    amount: amountInVND,
    amountInCents: amountInCents,
    createDate: createDate,
    expireDate: expireDate,
    urlBase: VNPAY_CONFIG.vnp_Url,
    hasParams: true,
    returnUrl: VNPAY_CONFIG.vnp_ReturnUrl
  });
  
  // Validate the URL was created correctly
  if (!paymentUrl || !paymentUrl.startsWith('http')) {
    throw new Error('Failed to create payment URL');
  }
  
  return paymentUrl;
}

/**
 * Verify VNPay callback data
 * @param {Object} vnp_Params - VNPay callback parameters
 * @returns {Object} Verification result with isValid and responseCode
 */
function verifyPaymentCallback(vnp_Params) {
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  // Filter out empty parameters and sort alphabetically (same as signature generation)
  const paramsForSigning = {};
  Object.keys(vnp_Params)
    .sort() // Sort alphabetically
    .forEach(key => {
      const value = vnp_Params[key];
      // Only include non-empty parameters (same logic as signature generation)
      if (value !== null && value !== undefined && value !== '') {
        paramsForSigning[key] = String(value);
      }
    });

  // Build sign data string: key1=value1&key2=value2 (same format as signature generation)
  const signData = Object.keys(paramsForSigning)
    .map(key => `${key}=${paramsForSigning[key]}`)
    .join('&');
  
  console.log('🔐 [VNPay] Verifying signature with sign data:', signData.substring(0, 100) + '...');
  
  // Use trimmed hash secret (same as signature generation)
  const hashSecret = VNPAY_CONFIG.vnp_HashSecret.trim();
  
  // Create secure hash using SHA512 (same as signature generation)
  const hmac = crypto.createHmac('sha512', hashSecret);
  hmac.update(signData, 'utf8');
  const calculatedHash = hmac.digest('hex').toLowerCase(); // Use lowercase (same as signature generation)
  
  // Compare hashes (case-insensitive comparison)
  const isValid = secureHash && secureHash.toLowerCase() === calculatedHash;
  
  console.log('🔐 [VNPay] Signature verification:', {
    receivedHash: secureHash ? secureHash.substring(0, 20) + '...' : 'missing',
    calculatedHash: calculatedHash.substring(0, 20) + '...',
    isValid: isValid
  });
  
  const responseCode = vnp_Params.vnp_ResponseCode || '99';

  return {
    isValid,
    responseCode,
    transactionId: vnp_Params.vnp_TransactionNo,
    amount: vnp_Params.vnp_Amount ? parseInt(vnp_Params.vnp_Amount) / 100 : 0, // Convert back from cents
    orderId: vnp_Params.vnp_TxnRef,
    orderInfo: vnp_Params.vnp_OrderInfo,
    bankCode: vnp_Params.vnp_BankCode,
    payDate: vnp_Params.vnp_PayDate,
  };
}

/**
 * Get response message from VNPay response code
 * @param {String} responseCode - VNPay response code
 * @returns {String} Response message
 */
function getResponseMessage(responseCode) {
  const responseMessages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
    '10': 'Xác thực thông tin thẻ/tài khoản không đúng. Quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
    '12': 'Thẻ/Tài khoản bị khóa.',
    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Quá 3 lần.',
    '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
    '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Lỗi không xác định.',
  };

  return responseMessages[responseCode] || 'Lỗi không xác định.';
}

module.exports = {
  createPaymentUrl,
  verifyPaymentCallback,
  getResponseMessage,
  VNPAY_CONFIG,
};

