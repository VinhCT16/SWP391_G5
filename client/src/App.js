<<<<<<< HEAD
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import CustomerContractView from "./pages/CustomerContractView";
import './App.css';
import CheckoutPage from './pages/CheckoutPage';
import 'bootstrap/dist/css/bootstrap.min.css';
=======
import { Routes, Route, Navigate } from "react-router-dom";
>>>>>>> parent of 8c3d20d (Merge branch 'merge-main' into merge/huyphq)
import CreateRequestPage from "./pages/CreateRequestPage";
import ManageRequestsPage from "./pages/ManageRequestsPage";
import EditRequestPage from "./pages/EditRequestPage";
import QuoteBuilderPage from "./pages/QuoteBuilderPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/requests/new" />} />
      <Route path="/requests/new" element={<CreateRequestPage />} />
      <Route path="/my-requests" element={<ManageRequestsPage />} />
      <Route path="/requests/:id/edit" element={<EditRequestPage />} />
      <Route path="/requests/:id/quote" element={<QuoteBuilderPage />} />
      <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    </Routes>
  );
}
