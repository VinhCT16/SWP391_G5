import React from 'react';
import DashboardTab from './DashboardTab';
import BookMoveTab from './BookMoveTab';
import MyMovesTab from './MyMovesTab';
import ContractsTab from './ContractsTab';
import ProgressTab from './ProgressTab';
import ProfileTab from './ProfileTab';

export default function CustomerDashboardTabs({ activeTab, ...props }) {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardTab {...props} />;
    case 'book-move':
      return <BookMoveTab {...props} />;
    case 'my-moves':
      return <MyMovesTab {...props} />;
    case 'contracts':
      return <ContractsTab {...props} />;
    case 'progress':
      return <ProgressTab {...props} />;
    case 'profile':
      return <ProfileTab {...props} />;
    default:
      return <DashboardTab {...props} />;
  }
}

