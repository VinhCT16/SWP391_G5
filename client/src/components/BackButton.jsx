import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BackButton({ fallbackPath = '/', children = '← Back' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to a specific path
      navigate(fallbackPath);
    }
  };

  // Don't show back button on landing page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <button 
      onClick={handleBack}
      className="back-button"
      type="button"
    >
      {children}
    </button>
  );
}
