// API base khớp server: /api
const BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Fetch with credentials for cookie-based auth
const fetchWithAuth = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies in all requests
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// ----- CREATE (JSON body, images là mảng base64 nếu có) -----
export async function createRequest(payload) {
  const res = await fetchWithAuth(`${BASE}/requests`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- LIST theo phone (Manage) -----
export async function listRequestsByPhone(phone, status) {
  const u = new URL(`${BASE}/requests`);
  if (phone) u.searchParams.set("phone", phone);
  if (status) u.searchParams.set("status", status);
  const res = await fetchWithAuth(u.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- GET ONE (Edit) -----
export async function getRequest(id) {
  const res = await fetchWithAuth(`${BASE}/requests/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- UPDATE (Edit): chỉ patch các trường cho phép -----
export async function updateRequest(id, patch) {
  const res = await fetchWithAuth(`${BASE}/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- CANCEL (Manage) -----
export async function cancelRequest(id) {
  const res = await fetchWithAuth(`${BASE}/requests/${id}/cancel`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- GET STAFF TASKS -----
// Lấy tất cả requests mà staff cần xử lý
export async function getStaffTasks(status) {
  const u = new URL(`${BASE}/requests/staff/tasks`);
  if (status) u.searchParams.set("status", status);
  const res = await fetchWithAuth(u.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Helper functions (aliases for backward compatibility)
export async function listRequests() { 
  return listRequestsByPhone(""); 
}

export async function deleteRequest(id) { 
  return cancelRequest(id); 
}

// Manager-specific functions
export async function getAllRequests(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`${BASE}/requests/all?${queryParams}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getMyRequests() {
  const res = await fetchWithAuth(`${BASE}/requests/my`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function updateRequestStatus(requestId, statusData) {
  const res = await fetchWithAuth(`${BASE}/requests/${requestId}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Get available staff for a request
export async function getAvailableStaffForRequest(requestId) {
  const res = await fetchWithAuth(`${BASE}/requests/${requestId}/available-staff`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Assign staff to request
export async function assignStaffToRequest(requestId, data) {
  const res = await fetchWithAuth(`${BASE}/requests/${requestId}/assign-staff`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(responseData.error || res.statusText);
  return responseData;
}