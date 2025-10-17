// client/src/api/requestApi.js
const API = process.env.REACT_APP_API || "/api";

async function json(res) {
  if (!res.ok) {
    const text = await res.text();
    try { throw new Error(JSON.parse(text)?.error || text || "Request failed"); }
    catch { throw new Error(text || "Request failed"); }
  }
  return res.json();
}

export function createRequest(payload) {
  return fetch(`${API}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(json);
}

export function listRequestsByPhone(phone, status) {
  const q = new URLSearchParams();
  if (phone) q.set("phone", phone);
  if (status) q.set("status", status);
  return fetch(`${API}/requests?${q.toString()}`).then(json);
}

export function getRequestById(id) {
  return fetch(`${API}/requests/${id}`).then(json);
}

export function updateRequest(id, payload) {
  return fetch(`${API}/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(json);
}

export function cancelRequest(id) {
  return fetch(`${API}/requests/${id}/cancel`, { method: "POST" }).then(json);
}
