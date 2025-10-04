import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/Homepage";
import CustomerReview from "./pages/CustomerReview";
import ManagerReview from "./pages/ManagerReview";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/customer-review" element={<CustomerReview />} />
          <Route path="/manager-review" element={<ManagerReview />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
