import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div className="landing-content" style={{ maxWidth: '800px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          MoveEase
        </h1>
        <p style={{ 
          fontSize: '1.5rem', 
          marginBottom: '30px',
          opacity: 0.9
        }}>
          Professional Moving Services Made Simple
        </p>
        <p style={{ 
          fontSize: '1.1rem', 
          marginBottom: '40px',
          opacity: 0.8,
          lineHeight: '1.6'
        }}>
          Experience seamless moving with our comprehensive platform. 
          From booking to completion, we handle everything with care and professionalism.
        </p>
        
        <div className="landing-features" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          <div className="feature-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Easy Booking</h3>
            <p>Simple online booking process with real-time availability</p>
          </div>
          <div className="feature-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Professional Service</h3>
            <p>Experienced staff and quality equipment for safe moves</p>
          </div>
          <div className="feature-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Real-time Tracking</h3>
            <p>Track your move progress and stay updated throughout</p>
          </div>
        </div>

        <div className="landing-actions">
          {user ? (
            <Link 
              to="/dashboard" 
              style={{
                display: 'inline-block',
                padding: '15px 30px',
                backgroundColor: 'white',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '50px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                margin: '0 10px',
                transition: 'transform 0.3s ease'
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/register" 
                style={{
                  display: 'inline-block',
                  padding: '15px 30px',
                  backgroundColor: 'white',
                  color: '#667eea',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: '0 10px',
                  transition: 'transform 0.3s ease'
                }}
              >
                Get Started
              </Link>
              <Link 
                to="/login" 
                style={{
                  display: 'inline-block',
                  padding: '15px 30px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: '0 10px',
                  border: '2px solid white',
                  transition: 'transform 0.3s ease'
                }}
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;

