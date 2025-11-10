import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ fallbackPath = '/dashboard' }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button 
      onClick={handleGoBack}
      className="back-button"
      style={{
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginBottom: '20px',
        fontSize: '14px'
      }}
    >
      ← Back
    </button>
  );
};

export default BackButton;

