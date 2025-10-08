import React, { useState } from "react";
import {
  Button,
  Card,
  Container,
  Form,
  InputGroup,
  FormControl,
  Badge,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Checkout() {
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVouchers, setAppliedVouchers] = useState([]);

  const placeOrder = () => {
    alert("Thanh toán thành công!");
    setIsCheckoutVisible(false);
  };

  const applyVoucher = () => {
    if (voucherCode.trim() !== "" && !appliedVouchers.includes(voucherCode)) {
      setAppliedVouchers([...appliedVouchers, voucherCode.trim()]);
      setVoucherCode("");
    }
  };

  const removeVoucher = (code) => {
    setAppliedVouchers(appliedVouchers.filter((v) => v !== code));
  };

  if (!isCheckoutVisible) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center vh-100"
      >
        <Card style={{ maxWidth: "600px", width: "100%" }}>
          <Card.Body className="text-center">
            <Card.Title>🎉 Cảm ơn bạn!</Card.Title>
            <p>Yêu cầu dịch vụ chuyển nhà đã được ghi nhận.</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center vh-100"
    >
      <Card style={{ maxWidth: "700px", width: "100%" }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">THANH TOÁN</Card.Title>
          <div className="mb-3">
            <p>🏠 Địa chỉ đi:</p>
            <p>🏡 Địa chỉ đến:</p>
            <p>📦 Gói dịch vụ:</p>
            <p>💰 Giá dịch vụ:</p>
            <p>➕ Phụ phí:</p>
            <h5 className="mt-3">📊 Tổng chi phí:</h5>
          </div>

          <Form className="mt-3">
            <Form.Group>
              <Form.Label>🎟️ Mã giảm giá</Form.Label>
              <InputGroup>
                <FormControl
                  type="text"
                  placeholder="Nhập mã voucher..."
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                />
                <Button variant="outline-primary" onClick={applyVoucher}>
                  Áp dụng
                </Button>
              </InputGroup>
            </Form.Group>
          </Form>

          <div className="mt-3">
            <Form.Label>✅ Mã đã áp dụng:</Form.Label>
            {appliedVouchers.length > 0 ? (
              <div>
                {appliedVouchers.map((code, index) => (
                  <Badge
                    bg="info"
                    text="dark"
                    key={index}
                    className="me-2 mb-2"
                  >
                    {code}{" "}
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => removeVoucher(code)}
                      className="ms-2 py-0 px-1"
                    >
                      ❌
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted fst-italic">Chưa sử dụng mã nào</p>
            )}
          </div>

          <Form className="mt-4">
            <Form.Group>
              <Form.Label>💳 Phương thức thanh toán</Form.Label>
              <Form.Check
                type="radio"
                label="Thanh toán khi hoàn tất dịch vụ"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="Thẻ ngân hàng"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="Ví điện tử (Momo, ZaloPay, VNPay...)"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === "wallet"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </Form.Group>
          </Form>

          <div className="mt-4 text-center">
            <Button variant="success" onClick={placeOrder} className="me-2">
              Xác nhận đặt dịch vụ
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCheckoutVisible(false)}
            >
              Quay lại
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Checkout;
