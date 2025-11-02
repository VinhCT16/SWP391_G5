import React from "react";
import { Routes, Route } from "react-router-dom";
import ContractList from "../components/ContractList";
import ContractDetail from "../components/ContractDetail";


const ContractPage = () => {
  return (
    <div className="contract-page">
      <Routes>
        <Route index element={<ContractList />} />
        <Route path=":id" element={<ContractDetail />} />
      </Routes>
    </div>
  );
};

export default ContractPage;
