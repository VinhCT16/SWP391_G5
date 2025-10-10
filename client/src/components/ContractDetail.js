import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getContractById } from "../api/contractAPI";
import "./Contract.css";

const ContractDetail = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await getContractById(id);
        setContract(data);
      } catch (error) {
        console.error("Lỗi khi tải hợp đồng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  if (loading) {
    return (
      <div className="contract-detail loading">
        <p>Đang tải dữ liệu hợp đồng...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="contract-detail">
        <p>Không tìm thấy hợp đồng với ID này.</p>
      </div>
    );
  }

  return (
    <div className="contract-detail">
      <h2>Chi tiết hợp đồng #{contract.contractNumber}</h2>

      <div className="section">
        <h3>Thông tin khách hàng</h3>
        <p><b>Tên khách hàng:</b> {contract.customerName}</p>
        <p>
          <b>Tình trạng:</b>{" "}
          <span
            className={`status-text ${
              contract.status === "Hoàn thành"
                ? "done"
                : contract.status === "Đang xử lý"
                ? "processing"
                : "cancelled"
            }`}
          >
            {contract.status}
          </span>
        </p>
      </div>

      <div className="section">
        <h3>Thông tin vận chuyển</h3>
        <p><b>Từ:</b> {contract.addressFrom}</p>
        <p><b>Đến:</b> {contract.addressTo}</p>
        <p>
          <b>Ngày chuyển:</b>{" "}
          {contract.moveDate
            ? new Date(contract.moveDate).toLocaleDateString("vi-VN")
            : "Chưa có"}
        </p>
        <p>
          <b>Giá:</b>{" "}
          {contract.price
            ? `${contract.price.toLocaleString("vi-VN")} VND`
            : "Chưa xác định"}
        </p>
        {contract.notes && <p><b>Ghi chú:</b> {contract.notes}</p>}
      </div>

      {contract.transportInfo && (
        <div className="section">
          <h3>Bên vận chuyển</h3>
          <p><b>Đơn vị vận chuyển:</b> {contract.transportInfo.company}</p>
          <p><b>Tài xế phụ trách:</b> {contract.transportInfo.driver}</p>
          <p><b>Phương tiện:</b> {contract.transportInfo.vehicle}</p>
          <p><b>Người hỗ trợ:</b> {contract.transportInfo.supporter}</p>
          <p><b>Số liên hệ:</b> {contract.transportInfo.contact}</p>
          <p>
            <b>Dự kiến đến nơi:</b>{" "}
            {contract.transportInfo.estimatedArrival
              ? new Date(contract.transportInfo.estimatedArrival).toLocaleDateString("vi-VN")
              : "Chưa có"}
          </p>
        </div>
      )}

      <div className="back-button-container">
        <Link to="/" className="btn-back">
          ← Quay lại danh sách hợp đồng
        </Link>
      </div>
    </div>
  );
};

export default ContractDetail;
