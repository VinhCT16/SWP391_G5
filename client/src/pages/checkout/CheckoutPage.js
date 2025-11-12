import React, { useState } from "react";
import { Container, Button } from "react-bootstrap";
import Summary from "../../components/checkout/Summary";
import Checkout from "../../components/checkout/Checkout";
import VoucherSection from "../../components/checkout/VoucherSection";
import PaymentMethod from "../../components/checkout/PaymentMethod";
import "bootstrap/dist/css/bootstrap.min.css";

function CheckoutPage() {
    const [isCheckoutVisible, setIsCheckoutVisible] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [appliedVouchers, setAppliedVouchers] = useState([]);
    const [voucherCode, setVoucherCode] = useState("");

    const applyVoucher = () => {
        if (!voucherCode.trim()) return;
        if (appliedVouchers.includes(voucherCode)) {
            alert("Mã này đã được áp dụng!");
            return;
        }
        setAppliedVouchers([...appliedVouchers, voucherCode]);
        setVoucherCode("");
    };

    const removeVoucher = (code) => {
        setAppliedVouchers(appliedVouchers.filter((v) => v !== code));
    };

    const placeOrder = () => {
        alert("✅ Đặt dịch vụ chuyển nhà thành công!");
        setIsCheckoutVisible(false);
    };

    if (!isCheckoutVisible) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div
                    className="bg-white p-5 rounded-4 shadow text-center"
                    style={{ maxWidth: "480px" }}
                >
                    <h3 className="mb-3 text-success">🎉 Cảm ơn bạn!</h3>
                    <p className="text-muted">
                        Yêu cầu dịch vụ chuyển nhà của bạn đã được ghi nhận.
                        <br />
                        Chúng tôi sẽ sớm liên hệ để xác nhận thông tin.
                    </p>
                    <Button variant="primary" onClick={() => setIsCheckoutVisible(true)}>
                        Quay lại trang thanh toán
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 py-5">
            <Container>
                <div
                    className="mx-auto p-4 bg-white shadow-sm rounded-4 border"
                    style={{ maxWidth: "850px" }}
                >
                    {/* Tiêu đề */}
                    <h2 className="text-center mb-4 fw-bold text-primary">
                        Thanh toán
                    </h2>

                    {/* Nội dung chính */}
                    <div className="d-flex flex-column gap-4">

                        <div className="pb-3 border-bottom">
                            <Checkout />
                        </div>

                        {/* Mã giảm giá */}
                        <div className="pt-2 pb-3 border-bottom">
                            <VoucherSection
                                voucherCode={voucherCode}
                                setVoucherCode={setVoucherCode}
                                appliedVouchers={appliedVouchers}
                                applyVoucher={applyVoucher}
                                removeVoucher={removeVoucher}
                            />
                        </div>

                        {/* Phương thức thanh toán */}
                        <div className="pt-2">
                            <PaymentMethod
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                            />
                        </div>
                    </div>

                    <div className="pb-3 border-bottom">
                        <Summary />
                    </div>

                    {/* Nút xác nhận */}
                    <div className="text-center mt-5">
                        <Button
                            variant="success"
                            className="px-5 py-3 fw-semibold rounded-pill shadow-sm"
                            onClick={placeOrder}
                            style={{ fontSize: "1.1rem" }}
                        >
                            Xác nhận thanh toán
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
}

export default CheckoutPage;
