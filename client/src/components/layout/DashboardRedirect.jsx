import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect when loading is complete
    if (loading) {
      return;
    }

    // Log for debugging
    console.log('[DashboardRedirect] Loading:', loading, 'User:', user);

    if (!user) {
      console.log('[DashboardRedirect] No user found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // Log user details
    console.log('[DashboardRedirect] User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      fullUser: user
    });

    // Determine redirect path based on role
    let redirectPath = '/';
    
    switch (user.role) {
      case 'customer':
        redirectPath = '/customer-dashboard';
        break;
      case 'manager':
        redirectPath = '/manager-dashboard';
        break;
      case 'staff':
        redirectPath = '/staff-dashboard';
        break;
      case 'admin':
        redirectPath = '/admin-dashboard';
        break;
      default:
        console.warn('[DashboardRedirect] Unknown role:', user.role, 'Full user:', user);
        redirectPath = '/';
        break;
    }

    console.log('[DashboardRedirect] Redirecting to:', redirectPath);
    
    // Perform redirect
    navigate(redirectPath, { replace: true });
  }, [user, loading, navigate]);

  // Show loading/redirecting message
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      fontSize: '18px',
      color: '#666',
      gap: '10px'
    }}>
      {loading ? (
        <>
          <div>Loading user information...</div>
        </>
      ) : user ? (
        <>
          <div>Redirecting to {user.role} dashboard...</div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            If you're not redirected automatically, 
            <a 
              href={`/${user.role}-dashboard`} 
              style={{ color: '#007bff', marginLeft: '5px' }}
            >
              click here
            </a>
          </div>
        </>
      ) : (
        <div>Redirecting to login...</div>
      )}
    </div>
  );
}
