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
import Layout from "./components/Layout";
import CustomerReview from "./pages/CustomerReview";
import ManagerReview from "./pages/ManagerReview";
import ManagerDashboard from "./pages/ManagerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import './App.css';
import './components/Navigation.css';
import './components/Breadcrumb.css';
import './components/BackButton.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
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
            </Route>
            <Route element={<RoleProtectedRoute allowedRoles={['manager']} />}>
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
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
      </BrowserRouter>
    </div>
  );
}

export default App;
