import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';
import Navigation from './components/Navigation';
import Breadcrumb from './components/Breadcrumb';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerReview from "./pages/CustomerReview";
import ManagerReview from "./pages/ManagerReview";
import ManagerDashboard from "./pages/ManagerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import ContractForm from "./pages/ContractForm";
import ContractApproval from "./pages/ContractApproval";
import ContractDetailView from "./pages/ContractDetailView";
import './App.css';
import CheckoutPage from './pages/CheckoutPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import CreateRequestPage from "./pages/CreateRequestPage";
import ManageRequestsPage from "./pages/ManageRequestsPage";
import EditRequestPage from "./pages/EditRequestPage";
import RequestDetailPage from "./pages/RequestDetailPage";
import QuoteItemsPage from "./pages/QuoteItemsPage";
import QuoteServicePage from "./pages/QuoteServicePage";
import QuoteSummaryPage from "./pages/QuoteSummaryPage";
// QuotePage cũ - giữ để tương thích (có thể xóa sau)
import QuotePage from "./pages/QuotePage";

export default function App() {
  return (
    // <Routes>
    //   <Route path="/" element={<Navigate to="/requests/new" />} />
    //   <Route path="/requests/new" element={<CreateRequestPage />} />
    //   <Route path="/my-requests" element={<ManageRequestsPage />} />
    //   <Route path="/requests/:id/detail" element={<RequestDetailPage />} />
    //   <Route path="/requests/:id/edit" element={<EditRequestPage />} />
      
    //   {/* Báo giá mới - 3 màn */}
    //   <Route path="/quote/items" element={<QuoteItemsPage />} />
    //   <Route path="/quote/service" element={<QuoteServicePage />} />
    //   <Route path="/quote/summary" element={<QuoteSummaryPage />} />
      
    //   {/* QuotePage cũ - giữ để tương thích */}
    //   <Route path="/quote" element={<QuotePage />} />
      
    //   <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    // </Routes>
    <div className="App">
      <AuthProvider>
        <Navigation />
        <Breadcrumb />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer-review" element={<CustomerReview />} />
          <Route path="/manager-review" element={<ManagerReview />} />
          <Route path="/about" element={<About />} />
          
          {/* Dashboard redirect - redirects to appropriate dashboard based on role */}
          <Route element={<ProtectedRoute />}> 
            <Route path="/dashboard" element={<DashboardRedirect />} />
          </Route>
          
          {/* Role-specific dashboards */}
          <Route element={<RoleProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/contracts/:id" element={<CustomerContractView />} />
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/manager-dashboard" element={<ManagerDashboard />} />
            <Route path="/contract-form/:requestId" element={<ContractForm />} />
            <Route path="/contract-approval" element={<ContractApproval />} />
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}
