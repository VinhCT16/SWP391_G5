import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumb = () => {
  const location = useLocation();
  
  // Don't show breadcrumb on landing, login, or register pages
  if (['/', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const pathSegments = location.pathname.split('/').filter(segment => segment);
  
  const getBreadcrumbName = (segment, index) => {
    const pathMap = {
      'dashboard': 'Dashboard',
      'customer-dashboard': 'Customer Dashboard',
      'manager-dashboard': 'Manager Dashboard',
      'staff-dashboard': 'Staff Dashboard',
      'admin-dashboard': 'Admin Dashboard',
      'contracts': 'Contracts',
      'about': 'About'
    };
    
    return pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <nav className="breadcrumb-nav" style={{
      padding: '10px 20px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6'
    }}>
      <div className="breadcrumb-container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
          Home
        </Link>
        {pathSegments.map((segment, index) => (
          <React.Fragment key={index}>
            <span style={{ color: '#6c757d' }}>/</span>
            {index === pathSegments.length - 1 ? (
              <span style={{ color: '#6c757d' }}>
                {getBreadcrumbName(segment, index)}
              </span>
            ) : (
              <Link 
                to={`/${pathSegments.slice(0, index + 1).join('/')}`}
                style={{ textDecoration: 'none', color: '#007bff' }}
              >
                {getBreadcrumbName(segment, index)}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;

