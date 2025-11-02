import React from 'react';
import { useAuth } from '../context/AuthContext';

const ManagerReview = () => {
  const { user } = useAuth();

  return (
    <div className="manager-review" style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Manager Review Panel</h1>
      <p>Welcome, {user?.name}! Here you can manage reviews and feedback.</p>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Review Management</h3>
        <p>This feature is coming soon. You'll be able to:</p>
        <ul>
          <li>View all customer reviews</li>
          <li>Respond to reviews</li>
          <li>Monitor review trends</li>
          <li>Generate review reports</li>
        </ul>
      </div>
    </div>
  );
};

export default ManagerReview;

