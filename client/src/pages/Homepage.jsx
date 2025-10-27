import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

export default function Homepage() {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            🚚 Dịch vụ chuyển nhà chuyên nghiệp
          </h1>
          <p className="hero-subtitle">
            Chuyển nhà an toàn, nhanh chóng và tiết kiệm với đội ngũ chuyên nghiệp
          </p>
          <div className="hero-actions">
            <Link to="/requests/new" className="btn btn-primary">
              📦 Đặt dịch vụ ngay
            </Link>
            <Link to="/about" className="btn btn-secondary">
              ℹ️ Tìm hiểu thêm
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            🏠➡️🏡
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Nhanh chóng</h3>
              <p>Dịch vụ chuyển nhà trong ngày, đúng hẹn 100%</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>An toàn</h3>
              <p>Bảo hiểm đầy đủ, đồ đạc được bảo quản cẩn thận</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Giá cả hợp lý</h3>
              <p>Báo giá minh bạch, không phát sinh chi phí</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Chuyên nghiệp</h3>
              <p>Đội ngũ nhân viên giàu kinh nghiệm, tận tâm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Dịch vụ của chúng tôi</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>🏠 Chuyển nhà nội thành</h3>
              <p>Dịch vụ chuyển nhà trong thành phố với giá cả cạnh tranh</p>
              <ul>
                <li>Khảo sát miễn phí</li>
                <li>Đóng gói chuyên nghiệp</li>
                <li>Vận chuyển an toàn</li>
              </ul>
            </div>
            <div className="service-card">
              <h3>🌆 Chuyển nhà liên tỉnh</h3>
              <p>Dịch vụ chuyển nhà giữa các tỉnh thành</p>
              <ul>
                <li>Lộ trình tối ưu</li>
                <li>Theo dõi hành trình</li>
                <li>Bảo hiểm toàn diện</li>
              </ul>
            </div>
            <div className="service-card">
              <h3>🏢 Chuyển văn phòng</h3>
              <p>Dịch vụ chuyển văn phòng chuyên nghiệp</p>
              <ul>
                <li>Lắp đặt thiết bị</li>
                <li>Bố trí không gian</li>
                <li>Hỗ trợ 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="container">
          <h2 className="section-title">Quy trình đơn giản</h2>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Liên hệ</h3>
              <p>Gọi điện hoặc đặt dịch vụ online</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Khảo sát</h3>
              <p>Nhân viên đến khảo sát và báo giá</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Ký hợp đồng</h3>
              <p>Ký kết hợp đồng và thanh toán</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Thực hiện</h3>
              <p>Chuyển nhà theo đúng lịch trình</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Sẵn sàng chuyển nhà?</h2>
            <p>Liên hệ ngay để được tư vấn miễn phí</p>
            <div className="cta-actions">
              <Link to="/requests/new" className="btn btn-primary btn-large">
                📞 Đặt dịch vụ ngay
              </Link>
              <Link to="/reviews" className="btn btn-outline">
                ⭐ Xem đánh giá
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="quick-links">
        <div className="container">
          <h2 className="section-title">Truy cập nhanh</h2>
          <div className="links-grid">
            <Link to="/requests" className="link-card">
              <div className="link-icon">📋</div>
              <h3>Quản lý yêu cầu</h3>
              <p>Theo dõi và quản lý các yêu cầu chuyển nhà</p>
            </Link>
            <Link to="/contracts" className="link-card">
              <div className="link-icon">📄</div>
              <h3>Hợp đồng</h3>
              <p>Xem và quản lý hợp đồng dịch vụ</p>
            </Link>
            <Link to="/customer-dashboard" className="link-card">
              <div className="link-icon">👤</div>
              <h3>Bảng điều khiển</h3>
              <p>Quản lý tài khoản và dịch vụ</p>
            </Link>
            <Link to="/staff-dashboard" className="link-card">
              <div className="link-icon">👷</div>
              <h3>Nhân viên</h3>
              <p>Giao diện dành cho nhân viên</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
