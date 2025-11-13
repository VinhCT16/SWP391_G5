import React from 'react';
import ManageRequestsPage from '../../request/ManageRequestsPage';

export default function MyMovesTab({ requests, loading, onTabChange, onRefresh }) {
  // Render ManageRequestsPage directly - it handles its own data fetching
  return <ManageRequestsPage />;
}

