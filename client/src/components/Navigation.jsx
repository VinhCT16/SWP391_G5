import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Don't show navigation on landing, login, or register pages
  if (['/', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  // Inline styles
  const styles = {
    nav: {
      background: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 0'
    },
    brand: {
      display: 'flex',
      flexDirection: 'column'
    },
    brandLink: {
      textDecoration: 'none',
      color: '#333'
    },
    brandH2: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333'
    },
    brandSpan: {
      fontSize: '14px',
      color: '#666',
      marginTop: '2px'
    },
    navLinks: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },
    navLink: {
      textDecoration: 'none',
      color: '#666',
      fontSize: '16px',
      fontWeight: 500,
      padding: '8px 12px',
      borderRadius: '4px',
      transition: 'all 0.3s ease'
    },
    navLinkActive: {
      color: '#007bff',
      backgroundColor: '#e7f3ff'
    },
    navLinkPrimary: {
      background: '#007bff',
      color: 'white',
      padding: '8px 16px'
    },
    navUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    userMenu: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    userName: {
      color: '#333',
      fontSize: '14px',
      fontWeight: 500
    },
    logoutBtn: {
      padding: '8px 16px',
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.3s ease'
    },
    authLinks: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <Link to="/" style={styles.brandLink}>
            <h2 style={styles.brandH2}>Moving Service</h2>
            <span style={styles.brandSpan}>Fast. Safe. Reliable.</span>
          </Link>
        </div>

        <div style={styles.navLinks}>
          {user && (
            <>
              <Link 
                to="/dashboard" 
                style={{
                  ...styles.navLink,
                  ...(location.pathname === '/dashboard' ? styles.navLinkActive : {})
                }}
              >
                Dashboard
              </Link>
              
              {user.role === 'customer' && (
                <Link 
                  to="/customer-dashboard" 
                  style={{
                    ...styles.navLink,
                    ...(location.pathname === '/customer-dashboard' ? styles.navLinkActive : {})
                  }}
                >
                  My Moves
                </Link>
              )}
              
              {user.role === 'manager' && (
                <Link 
                  to="/manager-dashboard" 
                  style={{
                    ...styles.navLink,
                    ...(location.pathname === '/manager-dashboard' ? styles.navLinkActive : {})
                  }}
                >
                  Manager Panel
                </Link>
              )}
              
              {user.role === 'staff' && (
                <Link 
                  to="/staff-dashboard" 
                  style={{
                    ...styles.navLink,
                    ...(location.pathname === '/staff-dashboard' ? styles.navLinkActive : {})
                  }}
                >
                  Staff Panel
                </Link>
              )}

              {user.role === 'admin' && (
                <Link 
                  to="/admin-dashboard" 
                  style={{
                    ...styles.navLink,
                    ...(location.pathname === '/admin-dashboard' ? styles.navLinkActive : {})
                  }}
                >
                  Admin Panel
                </Link>
              )}

              <Link to="/about" style={styles.navLink}>About</Link>
            </>
          )}
        </div>

        <div style={styles.navUser}>
          {user ? (
            <div style={styles.userMenu}>
              <span style={styles.userName}>Welcome, {user.name}</span>
              <button 
                onClick={handleLogout} 
                style={styles.logoutBtn}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.borderColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = '#ddd';
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.navLink}>Login</Link>
              <Link to="/register" style={{ ...styles.navLink, ...styles.navLinkPrimary }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
