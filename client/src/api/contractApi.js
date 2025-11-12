// API base khớp server: /api
const BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Fetch with credentials for cookie-based auth
const fetchWithAuth = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

export async function getAllContracts(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `${BASE}/contracts?${queryParams}` : `${BASE}/contracts`;
  const res = await fetchWithAuth(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getCustomerContracts(customerId) {
  const res = await fetchWithAuth(`${BASE}/contracts/customer/${customerId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getContractById(id) {
  const res = await fetchWithAuth(`${BASE}/contracts/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getContractsForApproval(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `${BASE}/contracts/approval?${queryParams}` : `${BASE}/contracts/approval`;
  const res = await fetchWithAuth(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function createContractFromRequest(requestId, contractData) {
  const res = await fetchWithAuth(`${BASE}/contracts/from-request/${requestId}`, {
    method: 'POST',
    body: JSON.stringify(contractData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function approveContract(contractId, approvalData = {}) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/approve`, {
    method: 'PUT',
    body: JSON.stringify(approvalData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function rejectContract(contractId, rejectionData) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/reject`, {
    method: 'PUT',
    body: JSON.stringify(rejectionData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function approveAndAssignContract(contractId, data) {
  const res = await fetchWithAuth(`${BASE}/contracts/approve`, {
    method: 'POST',
    body: JSON.stringify({ contractId, ...data })
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(responseData.error || res.statusText);
  return responseData;
}

export async function assignStaffToContract(contractId, data) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/assign-staff`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(responseData.error || res.statusText);
  return responseData;
}

export async function getAvailableStaff(contractId) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/available-staff`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function managerSignContract(contractId) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/sign`, {
    method: 'PUT'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function customerSignContract(contractId) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/customer-sign`, {
    method: 'PUT'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function exportContractPDF(contractId) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/export`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || res.statusText);
  }
  const blob = await res.blob();
  return { data: blob };
}

export async function getAllServices() {
  const res = await fetchWithAuth(`${BASE}/contracts/services`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function updateContractStatus(contractId, statusData) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getContractProgress(contractId) {
  const res = await fetchWithAuth(`${BASE}/contracts/${contractId}/progress`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getAssignedContracts() {
  const res = await fetchWithAuth(`${BASE}/contracts/staff/assigned`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getContracts(params) {
  return getAllContracts(params);
}