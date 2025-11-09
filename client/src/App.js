import { Routes, Route, Navigate } from "react-router-dom";
import CreateRequestPage from "./pages/CreateRequestPage";
import ManageRequestsPage from "./pages/ManageRequestsPage";
import EditRequestPage from "./pages/EditRequestPage";
import RequestDetailPage from "./pages/RequestDetailPage";
import QuoteItemsPage from "./pages/QuoteItemsPage";
import QuoteServicePage from "./pages/QuoteServicePage";
import QuoteSummaryPage from "./pages/QuoteSummaryPage";
// Staff pages
import StaffDashboard from "./pages/StaffDashboard";
import StaffSurveyPage from "./pages/StaffSurveyPage";
import StaffTaskDetailPage from "./pages/StaffTaskDetailPage";
// QuotePage cũ - giữ để tương thích (có thể xóa sau)
import QuotePage from "./pages/QuotePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/requests/new" />} />
      <Route path="/requests/new" element={<CreateRequestPage />} />
      <Route path="/my-requests" element={<ManageRequestsPage />} />
      <Route path="/requests/:id/detail" element={<RequestDetailPage />} />
      <Route path="/requests/:id/edit" element={<EditRequestPage />} />
      
      {/* Báo giá mới - 3 màn */}
      <Route path="/quote/items" element={<QuoteItemsPage />} />
      <Route path="/quote/service" element={<QuoteServicePage />} />
      <Route path="/quote/summary" element={<QuoteSummaryPage />} />
      
      {/* Staff routes */}
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/staff/survey/:id" element={<StaffSurveyPage />} />
      <Route path="/staff/task/:id" element={<StaffTaskDetailPage />} />
      
      {/* QuotePage cũ - giữ để tương thích */}
      <Route path="/quote" element={<QuotePage />} />
      
      <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    </Routes>
  );
}
