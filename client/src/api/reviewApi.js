import apiClient from '../apiClient';

// Get all reviews
export const getAllReviews = (params = {}) => {
  return apiClient.get('/api/reviews', { params });
};

// Get reviews by customer
export const getCustomerReviews = (customerId) => {
  return apiClient.get(`/api/reviews/customer/${customerId}`);
};

// Create review
export const createReview = (reviewData) => {
  return apiClient.post('/api/reviews', reviewData);
};

// Update review
export const updateReview = (reviewId, reviewData) => {
  return apiClient.put(`/api/reviews/${reviewId}`, reviewData);
};

// Delete review
export const deleteReview = (reviewId) => {
  return apiClient.delete(`/api/reviews/${reviewId}`);
};

// Get review statistics
export const getReviewStats = () => {
  return apiClient.get('/api/reviews/stats');
};

// Alias for getAllReviews (used in About.js)
export const getReviews = getAllReviews;

// Default export for backward compatibility
const reviewApi = {
  getAllReviews,
  getCustomerReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviewStats,
  getReviews
};

export default reviewApi;
