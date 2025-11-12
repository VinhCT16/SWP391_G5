import React from 'react';
import RequestsTab from './RequestsTab';
import ContractsTab from './ContractsTab';

export default function ManagerDashboardTabs({ activeTab, ...props }) {
  switch (activeTab) {
    case 'requests':
      return <RequestsTab {...props} />;
    case 'contracts':
      return <ContractsTab {...props} />;
    default:
      return <RequestsTab {...props} />;
  }
}

