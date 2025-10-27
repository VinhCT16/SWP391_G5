// API Client configuration
const BASE_URL = "http://localhost:3000/api";

// Default headers
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Create API client instance
const apiClient = {
  // GET request
  async get(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // POST request
  async post(endpoint, data, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...defaultHeaders, ...options.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // PUT request
  async put(endpoint, data, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...defaultHeaders, ...options.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // PATCH request
  async patch(endpoint, data, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...defaultHeaders, ...options.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default apiClient;
