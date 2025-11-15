import React from 'react';
import TaskListTab from './TaskListTab';
import MyTasksTab from './MyTasksTab';
import HistoryTab from './HistoryTab';
import ProfileTab from './ProfileTab';

export default function StaffDashboardTabs({ activeTab, ...props }) {
  switch (activeTab) {
    case 'task-list':
      return <TaskListTab {...props} />;
    case 'my-tasks':
      return <MyTasksTab {...props} />;
    case 'history':
      return <HistoryTab {...props} />;
    case 'profile':
      return <ProfileTab {...props} />;
    default:
      return <TaskListTab {...props} />;
  }
}

