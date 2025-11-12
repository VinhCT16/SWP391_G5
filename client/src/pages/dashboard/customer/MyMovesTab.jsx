import React from 'react';
import { useNavigate } from 'react-router-dom';
import RequestList from '../../../components/request/RequestList';
import { cancelRequest } from '../../../api/requestApi';

export default function MyMovesTab({ requests, loading, onTabChange, onRefresh }) {
  const navigate = useNavigate();

  const handleEdit = (requestId) => {
    navigate(`/requests/${requestId}/edit`);
  };

  const handleCancel = async (requestId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy request này?')) {
      try {
        await cancelRequest(requestId);
        // Refresh the list
        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        alert('Không thể hủy request: ' + (err.message || 'Lỗi không xác định'));
      }
    }
  };

  if (loading) {
    return <div className="loading-state"><p>Loading your moves...</p></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <h3>No moves booked yet</h3>
        <p>Book your first move to get started!</p>
        <button className="btn btn-primary" onClick={() => onTabChange('book-move')}>
          Book a Move
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h2>My Moves</h2>
      <RequestList 
        items={requests} 
        onEdit={handleEdit}
        onCancel={handleCancel}
      />
    </div>
  );
}

