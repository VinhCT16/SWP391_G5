import React from "react";
import {
  Card,
  Form,
  InputGroup,
  FormControl,
  Button,
  Badge,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function VoucherSection({
  voucherCode,
  setVoucherCode,
  appliedVouchers,
  applyVoucher,
  removeVoucher,
}) {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Body className="px-4 py-3">
        <Card.Title className="fw-bold text-primary mb-3 d-flex align-items-center">
          Mã giảm giá
        </Card.Title>

        {/* Ô nhập mã */}
        <InputGroup className="mb-4">
          <FormControl
            type="text"
            placeholder="Nhập mã giảm giá của bạn..."
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            className="rounded-start-pill"
          />
          <Button
            variant="primary"
            onClick={applyVoucher}
            className="px-4 rounded-end-pill fw-semibold"
          >
            Áp dụng
          </Button>
        </InputGroup>

        {/* Danh sách mã đã áp dụng */}
        <div>
          <h6 className="fw-semibold mb-3 text-secondary">
            Mã đã áp dụng
          </h6>

          {appliedVouchers.length === 0 ? (
            <div className="text-center text-muted fst-italic py-2 border rounded-3 bg-light">
              Chưa sử dụng mã nào
            </div>
          ) : (
            appliedVouchers.map((code, index) => (
              <div
                key={index}
                className="d-flex justify-content-between align-items-center border p-2 rounded-3 mb-2 bg-light"
              >
                <div className="d-flex align-items-center">
                  <Badge bg="warning" text="dark" className="me-2">
                    {index + 1}
                  </Badge>
                  <span className="fw-semibold">{code}</span>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeVoucher(code)}
                >
                  ✕
                </Button>
              </div>
            ))
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default VoucherSection;
