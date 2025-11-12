import api from '../apiClient';

// Create tasks from contract
export const createTasksFromContract = (requestId, tasksData) => {
  return api.post(`/tasks/create/${requestId}`, tasksData);
};

// Get staff tasks
export const getStaffTasks = () => {
  return api.get('/tasks/my-tasks');
};

// Update task status
export const updateTaskStatus = (requestId, taskId, statusData) => {
  return api.put(`/tasks/update/${requestId}/${taskId}`, statusData);
};

// Get all staff
export const getAllStaff = () => {
  return api.get('/tasks/staff');
};

// Assign staff to task
export const assignStaffToTask = (requestId, taskId, assignmentData) => {
  return api.put(`/tasks/assign/${requestId}/${taskId}`, assignmentData);
};

// Update task details
export const updateTaskDetails = (requestId, taskId, detailsData) => {
  return api.put(`/tasks/details/${requestId}/${taskId}`, detailsData);
};