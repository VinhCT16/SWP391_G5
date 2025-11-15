import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleProtectedRoute from './components/layout/RoleProtectedRoute';
import DashboardRedirect from './components/layout/DashboardRedirect';
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import CustomerReview from "./pages/review/CustomerReview";
import ManagerReview from "./pages/review/ManagerReview";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import StaffDashboard from "./pages/dashboard/StaffDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import About from "./pages/about/About";
import ContractForm from "./pages/contract/ContractForm";
import ContractApproval from "./pages/contract/ContractApproval";
import ContractDetailView from "./pages/contract/ContractDetailView";
import CheckoutPage from './pages/checkout/CheckoutPage';
import CreateRequestPage from "./pages/request/CreateRequestPage";
import ManageRequestsPage from "./pages/request/ManageRequestsPage";
import EditRequestPage from "./pages/request/EditRequestPage";
import RequestDetailPage from "./pages/request/RequestDetailPage";
import ManagerRequestDetailPage from "./pages/request/ManagerRequestDetailPage";
import QuoteItemsPage from "./pages/quote/QuoteItemsPage";
import QuoteServicePage from "./pages/quote/QuoteServicePage";
import QuoteSummaryPage from "./pages/quote/QuoteSummaryPage";
import QuotePage from "./pages/quote/QuotePage";
import CustomerContractView from "./pages/contract/CustomerContractView";
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import PaymentFailedPage from "./pages/payment/PaymentFailedPage";

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
      
    //   {/* Staff routes */}
    //   <Route path="/staff/dashboard" element={<StaffDashboard />} />
    //   <Route path="/staff/survey/:id" element={<StaffSurveyPage />} />
    //   <Route path="/staff/task/:id" element={<StaffTaskDetailPage />} />
      
    //   {/* QuotePage cũ - giữ để tương thích */}
    //   <Route path="/quote" element={<QuotePage />} />
      
    //   <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    // </Routes>
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          
          {/* Review routes */}
          <Route path="/customer-review" element={<CustomerReview />} />
          <Route path="/manager-review" element={<ManagerReview />} />
          
          {/* Dashboard redirect - redirects to appropriate dashboard based on role */}
          <Route element={<ProtectedRoute />}> 
            <Route path="/dashboard" element={<DashboardRedirect />} />
          </Route>
          
          {/* Customer routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/contracts/:id" element={<CustomerContractView />} />
            <Route path="/requests/new" element={<CreateRequestPage />} />
            <Route path="/my-requests" element={<ManageRequestsPage />} />
            <Route path="/requests/:id/detail" element={<RequestDetailPage />} />
            <Route path="/requests/:id/edit" element={<EditRequestPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>
          
          {/* Manager routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/manager-dashboard" element={<ManagerDashboard />} />
            <Route path="/contract-form/:requestId" element={<ContractForm />} />
            <Route path="/contract-approval" element={<ContractApproval />} />
            <Route path="/contracts/:id" element={<ContractDetailView />} />
            <Route path="/manager/requests/:id/detail" element={<ManagerRequestDetailPage />} />
          </Route>
          
          {/* Staff routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Route>
          
          {/* Admin routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
          
          {/* Quote routes - accessible to authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/quote/items" element={<QuoteItemsPage />} />
            <Route path="/quote/service" element={<QuoteServicePage />} />
            <Route path="/quote/summary" element={<QuoteSummaryPage />} />
            <Route path="/quote" element={<QuotePage />} />
          </Route>
          
          {/* Payment routes - public for VNPay redirects */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          
          {/* 404 - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}
