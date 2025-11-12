import React from 'react';
import MyTasksTab from './MyTasksTab';
import RequestsTab from './RequestsTab';
import HistoryTab from './HistoryTab';
import ProfileTab from './ProfileTab';

export default function StaffDashboardTabs({ activeTab, ...props }) {
  switch (activeTab) {
    case 'my-tasks':
      return <MyTasksTab {...props} />;
    case 'requests':
      return <RequestsTab {...props} />;
    case 'history':
      return <HistoryTab {...props} />;
    case 'profile':
      return <ProfileTab {...props} />;
    default:
      return <MyTasksTab {...props} />;
  }
}

