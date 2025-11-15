const BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Fetch with credentials for cookie-based auth
const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
};

/**
 * Create VNPay payment URL for a request
 * @param {String} requestId - Request ID
 * @returns {Object} { paymentUrl, amount, requestId }
 */
export async function createVNPayPayment(requestId) {
  try {
    const res = await fetchWithAuth(`${BASE}/payments/vnpay/create`, {
      method: 'POST',
      body: JSON.stringify({ requestId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMessage = data.error || data.message || res.statusText;
      const errorDetails = data.details ? `\nDetails: ${data.details}` : '';
      throw new Error(`${errorMessage}${errorDetails}`);
    }
    return data;
  } catch (error) {
    console.error('Payment API error:', error);
    throw error;
  }
}

