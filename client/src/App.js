import { Routes, Route, Navigate } from "react-router-dom";
import CreateRequestPage from "./pages/CreateRequestPage";
import ManageRequestsPage from "./pages/ManageRequestsPage";
import EditRequestPage from "./pages/EditRequestPage";
import QuotePage from "./pages/QuotePage";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/requests/new" />} />
      <Route path="/requests/new" element={<CreateRequestPage />} />
      <Route path="/my-requests" element={<ManageRequestsPage />} />
      <Route path="/requests/:id/edit" element={<EditRequestPage />} />
      <Route path="/quote" element={<QuotePage />} />
      <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    </Routes>
  );
}
