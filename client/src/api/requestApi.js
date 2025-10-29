// API base khớp server: /api
const BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// ----- CREATE (JSON body, images là mảng base64 nếu có) -----
export async function createRequest(payload) {
  const res = await fetch(`${BASE}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(u.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- GET ONE (Edit) -----
export async function getRequest(id) {
  const res = await fetch(`${BASE}/requests/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- UPDATE (Edit): chỉ patch các trường cho phép -----
export async function updateRequest(id, patch) {
  const res = await fetch(`${BASE}/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ----- CANCEL (Manage) -----
export async function cancelRequest(id) {
  const res = await fetch(`${BASE}/requests/${id}/cancel`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

/* (tùy chọn) nếu còn nơi nào gọi listRequests / deleteRequest cũ:
export async function listRequests() { return listRequestsByPhone(""); }
export async function deleteRequest(id) { return cancelRequest(id); }
*/
