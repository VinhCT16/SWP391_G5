import React from "react";
import { Card, Row, Col } from "react-bootstrap";

function Checkout() {
  return (
    <Card className="border-0 shadow-sm rounded-3 mx-auto" style={{ maxWidth: "600px" }}>
      <Card.Body className="py-3 px-4">
        <Card.Title className="fw-bold text-primary mb-3 text-center">
          Thông tin chuyển nhà
        </Card.Title>

        <div className="text-muted" style={{ fontSize: "15px" }}>
          <Row className="align-items-center mb-2">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              👤 Người dùng:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>

          <Row className="align-items-center mb-2">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              Mã đơn:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>

          <Row className="align-items-center mb-2">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              Số điện thoại:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>

          <hr className="my-3" />

          <Row className="align-items-center mb-2">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              Địa chỉ đi:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>

          <Row className="align-items-center mb-2">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              Địa chỉ đến:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>

          <Row className="align-items-center mb-2">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              Thời gian:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>

          <Row className="align-items-center">
            <Col xs={5} sm={4} className="d-flex justify-content-end pe-3">
              Gói dịch vụ:
            </Col>
            <Col xs={7} sm={8} className="text-dark"></Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
}

export default Checkout;
