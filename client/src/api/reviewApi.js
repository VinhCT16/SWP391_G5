import api from '../apiClient';

// Lấy toàn bộ reviews
export const getReviews = () => api.get('/api/reviews');

// Lấy review theo id
export const getReview = (id) => api.get(`/api/reviews/${id}`);

// Thêm review
export const createReview = (data) => api.post('/api/reviews', data);

// Update review
export const updateReview = (id, data) => api.put(`/api/reviews/${id}`, data);

// Xóa review
export const deleteReview = (id) => api.delete(`/api/reviews/${id}`);
