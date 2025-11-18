import React from 'react';
import OverviewTab from './OverviewTab';
import UserManagementTab from './UserManagementTab';
import CustomerManagementTab from './CustomerManagementTab';
import ComplaintManagementTab from './ComplaintManagementTab';
import StaffManagementTab from './StaffManagementTab';
import SettingsTab from './SettingsTab';

import UserDetailsModal from './UserDetailsModal';
import CustomerDetailsModal from './CustomerDetailsModal';

export default function AdminDashboardTabs({ activeTab, showUserDetails, showCustomerDetails, ...props }) {
  return (
    <>
      {showUserDetails && (
        <UserDetailsModal
          user={props.selectedUser}
          onClose={props.onCloseUserDetails}
        />
      )}
      {showCustomerDetails && (
        <CustomerDetailsModal
          customer={props.selectedCustomer}
          customerComplaints={props.customerComplaints}
          onClose={props.onCloseCustomerDetails}
        />
      )}
      {activeTab === 'overview' && <OverviewTab {...props} />}
      {activeTab === 'users' && <UserManagementTab {...props} />}
      {activeTab === 'customers' && <CustomerManagementTab {...props} />}
      {activeTab === 'complaints' && <ComplaintManagementTab {...props} />}
      {activeTab === 'staff' && <StaffManagementTab {...props} />}
      {activeTab === 'settings' && <SettingsTab {...props} />}
      {!['overview', 'users', 'customers', 'complaints', 'staff', 'settings'].includes(activeTab) && (
        <OverviewTab {...props} />
      )}
    </>
  );
}

