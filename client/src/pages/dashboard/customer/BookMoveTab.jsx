import React from 'react';
import CreateRequestForm from '../../../components/request/CreateRequestForm';

export default function BookMoveTab({ onSuccess }) {
  return (
    <div className="dashboard-section">
      <h2>Book Your Move</h2>
      <CreateRequestForm onCreated={onSuccess} />
    </div>
  );
}

