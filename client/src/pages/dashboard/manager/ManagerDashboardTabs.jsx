import React from 'react';
import RequestsTab from './RequestsTab';
import ContractsTab from './ContractsTab';
import ProfileTab from './ProfileTab';
import ServicesTab from './ServicesTab';

export default function ManagerDashboardTabs({ activeTab, ...props }) {
  switch (activeTab) {
    case 'profile':
      return <ProfileTab {...props} />;
    case 'requests':
      return <RequestsTab {...props} />;
    case 'contracts':
      return <ContractsTab {...props} />;
    case 'services':
      return <ServicesTab {...props} />;
    default:
      return <RequestsTab {...props} />;
  }
}

