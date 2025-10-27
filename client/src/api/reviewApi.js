// Review API functions
const BASE = "http://localhost:3000/api";

// Mock data for development - replace with actual API calls when backend is ready
const mockReviews = [
  {
    _id: "1",
    customerEmail: "customer1@example.com",
    customerPhone: "0123456789",
    rating: 5,
    content: "Dịch vụ chuyển nhà rất tốt, nhân viên chuyên nghiệp và nhiệt tình!",
    comment: "Dịch vụ chuyển nhà rất tốt, nhân viên chuyên nghiệp và nhiệt tình!",
    createdAt: new Date().toISOString(),
    serviceId: "service123"
  },
  {
    _id: "2", 
    customerEmail: "customer2@example.com",
    customerPhone: "0987654321",
    rating: 4,
    content: "Thời gian chuyển nhà đúng hẹn, đồ đạc được bảo quản cẩn thận.",
    comment: "Thời gian chuyển nhà đúng hẹn, đồ đạc được bảo quản cẩn thận.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    serviceId: "service456"
  },
  {
    _id: "3",
    customerEmail: "customer3@example.com", 
    customerPhone: "0555666777",
    rating: 5,
    content: "Cảm ơn đội ngũ Moving Service đã giúp tôi chuyển nhà một cách suôn sẻ!",
    comment: "Cảm ơn đội ngũ Moving Service đã giúp tôi chuyển nhà một cách suôn sẻ!",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    serviceId: "service789"
  }
];

// Get all reviews
export async function getReviews() {
  try {
    // For now, return mock data
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${BASE}/reviews`);
    // const data = await response.json();
    // return data;
    
    return { data: mockReviews };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { data: [] };
  }
}

// Create a new review
export async function createReview(reviewData) {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${BASE}/reviews`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(reviewData)
    // });
    // const data = await response.json();
    // return data;
    
    // Mock response for development
    const newReview = {
      _id: Date.now().toString(),
      ...reviewData,
      createdAt: new Date().toISOString()
    };
    mockReviews.unshift(newReview);
    return { data: newReview };
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

// Update a review
export async function updateReview(reviewId, reviewData) {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${BASE}/reviews/${reviewId}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(reviewData)
    // });
    // const data = await response.json();
    // return data;
    
    // Mock response for development
    const index = mockReviews.findIndex(r => r._id === reviewId);
    if (index !== -1) {
      mockReviews[index] = { ...mockReviews[index], ...reviewData };
      return { data: mockReviews[index] };
    }
    throw new Error('Review not found');
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

// Delete a review
export async function deleteReview(reviewId) {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${BASE}/reviews/${reviewId}`, {
    //   method: 'DELETE'
    // });
    // return response.ok;
    
    // Mock response for development
    const index = mockReviews.findIndex(r => r._id === reviewId);
    if (index !== -1) {
      mockReviews.splice(index, 1);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}
