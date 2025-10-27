import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import ReviewsPage from "./pages/ReviewsPage";
import ContractsPage from "./pages/ContractsPage";
import About from "./pages/About";
import CreateRequestPage from "./pages/CreateRequestPage";
import ManageRequestsPage from "./pages/ManageRequestsPage";
import EditRequestPage from "./pages/EditRequestPage";
import RequestsPage from "./pages/RequestsPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <Routes>
      {/* Main Routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/about" element={<About />} />
      
      {/* Request Management Routes */}
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/requests/new" element={<CreateRequestPage />} />
      <Route path="/requests/:id/edit" element={<EditRequestPage />} />
      <Route path="/my-requests" element={<ManageRequestsPage />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/customer-dashboard" element={<CustomerDashboard />} />
      <Route path="/staff-dashboard" element={<StaffDashboard />} />
      
      {/* Development Routes - for easy access during development */}
      <Route path="/dev/about" element={<About />} />
      <Route path="/dev/requests" element={<RequestsPage />} />
      <Route path="/dev/customer" element={<CustomerDashboard />} />
      <Route path="/dev/staff" element={<StaffDashboard />} />
      <Route path="/dev/dashboard" element={<Dashboard />} />
      <Route path="/dev/reviews" element={<ReviewsPage />} />
      <Route path="/dev/contracts" element={<ContractsPage />} />
      
      {/* 404 Route */}
      <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    </Routes>
  );
}
