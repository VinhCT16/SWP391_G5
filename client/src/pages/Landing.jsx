import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <h1>MoveEase</h1>
            <span>Professional Moving Services</span>
          </div>
          <nav className="header-nav">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="nav-link btn-primary">Get Started</Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Moving Made Simple</h1>
            <p>Professional, reliable, and affordable moving services. Let us handle your next move with care and precision.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">Book Your Move</Link>
              <Link to="/login" className="btn btn-outline btn-large">Sign In</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="moving-truck">🚚</div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <h2>Why Choose MoveEase?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🚚</div>
                <h3>Professional Movers</h3>
                <p>Experienced and trained professionals who handle your belongings with the utmost care.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📦</div>
                <h3>Safe & Secure</h3>
                <p>Your belongings are protected with comprehensive insurance and secure handling.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>Best Prices</h3>
                <p>Competitive pricing with transparent quotes. No hidden fees or surprises.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⏰</div>
                <h3>On Time</h3>
                <p>Punctual service with real-time tracking. We respect your time and schedule.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🛡️</div>
                <h3>Fully Insured</h3>
                <p>Complete coverage for your peace of mind during the entire moving process.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📞</div>
                <h3>24/7 Support</h3>
                <p>Round-the-clock customer support to assist you whenever you need help.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Move?</h2>
              <p>Join thousands of satisfied customers who trust MoveEase for their moving needs.</p>
              <Link to="/register" className="btn btn-primary btn-large">Get Started Today</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>MoveEase</h3>
              <p>Professional moving services you can trust.</p>
            </div>
            <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li>Local Moving</li>
                <li>Long Distance</li>
                <li>Commercial Moving</li>
                <li>Packing Services</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Contact Us</li>
                <li>FAQ</li>
                <li>Customer Service</li>
                <li>Track Your Move</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 MoveEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

