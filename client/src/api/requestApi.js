// API base khớp server: /api
const BASE = "http://localhost:3000/api";

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

// ----- GET MY REQUESTS (Customer Dashboard) -----
export async function getMyRequests() {
  // For now, return mock data since we don't have user authentication yet
  // TODO: Replace with actual API call when authentication is implemented
  const mockRequests = [
    {
      _id: "1",
      requestId: "REQ001",
      moveDetails: {
        fromAddress: "123 Main St, District 1, HCMC",
        toAddress: "456 Oak Ave, District 3, HCMC",
        moveDate: "2024-01-15",
        serviceType: "Local Move",
        phone: "0123456789"
      },
      status: "submitted",
      createdAt: "2024-01-10T10:00:00Z",
      approval: {
        approved: false,
        rejectionReason: null,
        notes: "Under review"
      }
    },
    {
      _id: "2",
      requestId: "REQ002",
      moveDetails: {
        fromAddress: "789 Pine St, District 2, HCMC",
        toAddress: "321 Elm St, District 7, HCMC",
        moveDate: "2024-01-20",
        serviceType: "Long Distance",
        phone: "0987654321"
      },
      status: "approved",
      createdAt: "2024-01-12T14:30:00Z",
      approval: {
        approved: true,
        rejectionReason: null,
        notes: "Approved for moving"
      }
    }
  ];
  
  return { data: { requests: mockRequests } };
}

/* (tùy chọn) nếu còn nơi nào gọi listRequests / deleteRequest cũ:
export async function listRequests() { return listRequestsByPhone(""); }
export async function deleteRequest(id) { return cancelRequest(id); }
*/
