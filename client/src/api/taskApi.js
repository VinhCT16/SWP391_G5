import apiClient from './apiClient';

// Create tasks from request
export const createTasksFromRequest = (requestId, tasksData) => {
  return apiClient.post(`/tasks/create/${requestId}`, tasksData);
};

// Get staff tasks
export const getStaffTasks = () => {
  return apiClient.get('/tasks/my-tasks');
};

// Update task status
export const updateTaskStatus = (requestId, taskId, statusData) => {
  return apiClient.put(`/tasks/update/${requestId}/${taskId}`, statusData);
};

// Get all staff
export const getAllStaff = () => {
  return apiClient.get('/tasks/staff');
};

// Assign staff to task
export const assignStaffToTask = (requestId, taskId, assignmentData) => {
  return apiClient.put(`/tasks/assign/${requestId}/${taskId}`, assignmentData);
};

// Update task details
export const updateTaskDetails = (requestId, taskId, detailsData) => {
  return apiClient.put(`/tasks/details/${requestId}/${taskId}`, detailsData);
};