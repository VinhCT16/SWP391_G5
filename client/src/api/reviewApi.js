import axios from "axios";

const API_URL = "http://localhost:5000/reviews";

// Lấy toàn bộ reviews
export const getReviews = () => axios.get(`${API_URL}`);

// Lấy review theo id
export const getReview = (id) => axios.get(`${API_URL}/${id}`);

// Thêm review
export const createReview = (data) => axios.post(API_URL, data);

// Update review
export const updateReview = (id, data) => axios.put(`${API_URL}/${id}`, data);

// Xóa review
export const deleteReview = (id) => axios.delete(`${API_URL}/${id}`);
