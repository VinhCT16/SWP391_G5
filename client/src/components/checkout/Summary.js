import React from "react";
import { Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";


function Summary() {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Body>
        <Card.Title className="fw-bold text-primary mb-3">
          Tóm tắt thanh toán
        </Card.Title>

        <div className="text-muted">
          <div className="d-flex justify-content-between mb-2">
            <span>Giá gốc:</span>
            <span className="fw-semibold text-dark">---</span>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Giá voucher:</span>
            <span className="fw-semibold text-success">---</span>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Phương thức vận chuyển:</span>
            <span className="fw-semibold text-dark">---</span>
          </div>

          <div className="d-flex justify-content-between mb-3">
            <span>Phương thức thanh toán:</span>
            <span className="fw-semibold text-dark">---</span>
          </div>

          <hr />

          <div className="d-flex justify-content-between align-items-center">
            <h6 className="fw-bold text-dark mb-0">Tổng cộng:</h6>
            <h5 className="fw-bold text-success mb-0">---</h5>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default Summary;
