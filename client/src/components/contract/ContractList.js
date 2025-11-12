import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getContracts } from "../../api/contractApi";
import "./Contract.css";

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts();
        setContracts(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách hợp đồng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  if (loading) {
    return <div className="contract-list">Đang tải danh sách hợp đồng...</div>;
  }

  return (
    <div className="contract-list">
      <h2>Danh sách hợp đồng vận chuyển</h2>
      {contracts.length === 0 ? (
        <p>Không có hợp đồng nào để hiển thị.</p>
      ) : (
        <ul>
          {contracts.map((contract) => (
            <li key={contract._id || contract.id}>
              <Link to={`/contracts/${contract._id || contract.id}`} className="contract-item">
                <div className="contract-main">
                  <strong>{contract.contractNumber}</strong> - {contract.customerName}
                </div>
                <div className="contract-status">
                  <span
                    className={`status-badge ${
                      contract.status === "Hoàn thành"
                        ? "done"
                        : contract.status === "Đang xử lý"
                        ? "processing"
                        : "cancelled"
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContractList;
