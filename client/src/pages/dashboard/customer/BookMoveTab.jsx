import React from 'react';
import CreateRequestPage from '../../request/CreateRequestPage';

export default function BookMoveTab({ onSuccess }) {
  return (
    <div className="dashboard-section">
      <h2>Book Your Move</h2>
      <CreateRequestPage onCreated={onSuccess} />
    </div>
  );
}

