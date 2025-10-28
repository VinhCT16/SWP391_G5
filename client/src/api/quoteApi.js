// client/src/api/quoteApi.js
import api from "./_base";

/** 🔹 Gọi báo giá tạm thời (ước tính giá) */
export const estimateQuote = (data) => api.post("/quotes/estimate", data);

/** 🔹 Tạo báo giá chính thức (sau khi confirm hoặc lưu DB) */
export const createQuote = (data) => api.post("/quotes", data);

/** 🔹 Lấy tất cả báo giá của một request */
export const listQuotesByRequest = (requestId) =>
  api.get(`/quotes/request/${requestId}`);

/** 🔹 Lấy chi tiết 1 báo giá cụ thể */
export const getQuote = (quoteId) => api.get(`/quotes/${quoteId}`);

/** 🔹 Gửi thương lượng giá */
export const negotiateQuote = (id, payload) =>
  api.post(`/quotes/${id}/negotiate`, payload);

/** 🔹 Nhân viên xác nhận báo giá cuối */
export const confirmQuote = (id, payload) =>
  api.post(`/quotes/${id}/confirm`, payload);
