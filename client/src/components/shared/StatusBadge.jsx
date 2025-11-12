import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, className = '' }) {
  const getStatusClass = (status) => {
    if (!status) return 'status-unknown';
    const normalized = status.toLowerCase().replace(/_/g, '-');
    return `status-${normalized}`;
  };

  return (
    <span className={`status-badge ${getStatusClass(status)} ${className}`}>
      {status?.replace(/_/g, ' ') || 'Unknown'}
    </span>
  );
}

