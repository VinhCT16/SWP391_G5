import React from 'react';
import OverviewTab from './OverviewTab';
import UserManagementTab from './UserManagementTab';
import CustomerManagementTab from './CustomerManagementTab';
import ComplaintManagementTab from './ComplaintManagementTab';
import StaffManagementTab from './StaffManagementTab';
import SettingsTab from './SettingsTab';

export default function AdminDashboardTabs({ activeTab, ...props }) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab {...props} />;
    case 'users':
      return <UserManagementTab {...props} />;
    case 'customers':
      return <CustomerManagementTab {...props} />;
    case 'complaints':
      return <ComplaintManagementTab {...props} />;
    case 'staff':
      return <StaffManagementTab {...props} />;
    case 'settings':
      return <SettingsTab {...props} />;
    default:
      return <OverviewTab {...props} />;
  }
}

