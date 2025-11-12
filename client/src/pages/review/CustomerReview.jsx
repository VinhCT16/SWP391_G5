import React from 'react';
import { useAuth } from '../../context/AuthContext';

const CustomerReview = () => {
  const { user } = useAuth();

  return (
    <div className="customer-review" style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Customer Reviews</h1>
      <p>Welcome, {user?.name}! Here you can view and manage your reviews.</p>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Review Management</h3>
        <p>This feature is coming soon. You'll be able to:</p>
        <ul>
          <li>View your past reviews</li>
          <li>Submit new reviews for completed moves</li>
          <li>Edit existing reviews</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerReview;

