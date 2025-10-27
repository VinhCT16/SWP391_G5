import { apiGet, apiPost, apiPut, apiDelete } from "./_base";


export function estimateQuote(data) {
  return apiPost("/quotes/estimate", data);
}

export function createQuote(requestId, data) {
  return apiPost(`/quotes?requestId=${requestId}`, data);
}

export function getQuotesByRequest(requestId) {
  return apiGet(`/quotes/request/${requestId}`);
}

export function getQuote(id) {
  return apiGet(`/quotes/${id}`);
}

export function negotiateQuote(id, payload) {
  return apiPost(`/quotes/${id}/negotiate`, payload);
}

export function confirmQuote(id, payload) {
  return apiPost(`/quotes/${id}/confirm`, payload);
}
