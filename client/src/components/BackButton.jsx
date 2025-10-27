import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ fallbackPath = "/" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to the provided path or home
      navigate(fallbackPath);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="back-button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        color: '#495057',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '16px'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#e9ecef';
        e.target.style.borderColor = '#adb5bd';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#f8f9fa';
        e.target.style.borderColor = '#dee2e6';
      }}
    >
      <span style={{ fontSize: '16px' }}>←</span>
      Quay lại
    </button>
  );
}
