import React from "react";
import { Card, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function PaymentMethod({ paymentMethod, setPaymentMethod }) {
  const methods = [
    {
      id: "payment-cod",
      value: "cod",
      label: "Thanh toán khi hoàn tất dịch vụ",
      icon: "https://cdn-icons-png.flaticon.com/512/2920/2920244.png",
    },
    {
      id: "payment-card",
      value: "card",
      label: "Thẻ ngân hàng / ATM",
      icon: "https://cdn-icons-png.flaticon.com/512/196/196578.png",
    },
    {
      id: "payment-wallet",
      value: "wallet",
      label: "Ví điện tử (Momo, ZaloPay, VNPay…)",
      icon: "https://cdn-icons-png.flaticon.com/512/5968/5968705.png",
    },
  ];

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Body className="px-4 py-3">
        <Card.Title className="fw-bold text-primary mb-4 d-flex align-items-center">
          Phương thức thanh toán
        </Card.Title>

        <Form className="d-flex flex-column gap-3">
          {methods.map((method) => (
            <div
              key={method.value}
              className={`d-flex align-items-center justify-content-between p-3 rounded-3 border ${
                paymentMethod === method.value
                  ? "border-primary bg-light"
                  : "border-secondary-subtle"
              }`}
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
              }}
              onClick={() => setPaymentMethod(method.value)}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <Form.Check
                  type="radio"
                  id={method.id}
                  name="paymentMethod"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="me-3"
                />
                <label
                  htmlFor={method.id}
                  className="fw-semibold text-secondary mb-0"
                  style={{ cursor: "pointer" }}
                >
                  {method.label}
                </label>
              </div>

              <img
                src={method.icon}
                alt={method.label}
                width="36"
                height="36"
                className="ms-3"
              />
            </div>
          ))}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default PaymentMethod;
