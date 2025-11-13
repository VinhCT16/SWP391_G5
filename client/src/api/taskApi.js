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

// Create tasks from contract
export async function createTasksFromContract(requestId, tasksData) {
  const res = await fetchWithAuth(`${BASE}/tasks/create/${requestId}`, {
    method: 'POST',
    body: JSON.stringify(tasksData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Get staff tasks
export async function getStaffTasks() {
  const res = await fetchWithAuth(`${BASE}/tasks/my-tasks`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Update task status
export async function updateTaskStatus(taskId, statusData) {
  const res = await fetchWithAuth(`${BASE}/tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Get all staff
export async function getAllStaff() {
  const res = await fetchWithAuth(`${BASE}/tasks/staff`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Assign staff to task
export async function assignStaffToTask(taskId, assignmentData) {
  const res = await fetchWithAuth(`${BASE}/tasks/${taskId}/assign`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Update task details
export async function updateTaskDetails(taskId, detailsData) {
  const res = await fetchWithAuth(`${BASE}/tasks/${taskId}/details`, {
    method: 'PUT',
    body: JSON.stringify(detailsData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Get task by ID
export async function getTaskById(taskId) {
  const res = await fetchWithAuth(`${BASE}/tasks/${taskId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Get tasks by request ID
export async function getTasksByRequest(requestId) {
  const res = await fetchWithAuth(`${BASE}/tasks/request/${requestId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Create a single task
export async function createTask(taskData) {
  const res = await fetchWithAuth(`${BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// Delete task
export async function deleteTask(taskId) {
  const res = await fetchWithAuth(`${BASE}/tasks/${taskId}`, {
    method: 'DELETE'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}