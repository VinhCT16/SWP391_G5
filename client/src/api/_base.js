// client/src/api/_base.js
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

/** --- GET --- */
export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API GET failed: ${res.status}`);
  return res.json();
}

/** --- POST --- */
export async function apiPost(path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API POST failed: ${res.status}`);
  return res.json();
}

/** --- PUT --- */
export async function apiPut(path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API PUT failed: ${res.status}`);
  return res.json();
}

/** --- DELETE --- */
export async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API DELETE failed: ${res.status}`);
  return res.json();
}

/** --- Default export (để import api.post, api.get, ...) --- */
const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

export default api;
