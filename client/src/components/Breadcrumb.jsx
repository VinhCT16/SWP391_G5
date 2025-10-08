import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumb() {
  const location = useLocation();

  // Don't show breadcrumbs on landing page
  if (location.pathname === '/') {
    return null;
  }

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    const items = [{ name: 'Home', path: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let displayName = segment;
      
      // Convert path segments to readable names
      switch (segment) {
        case 'dashboard':
          displayName = 'Dashboard';
          break;
        case 'customer-dashboard':
          displayName = 'My Moves';
          break;
        case 'manager-dashboard':
          displayName = 'Manager Panel';
          break;
        case 'staff-dashboard':
          displayName = 'Staff Panel';
          break;
        case 'login':
          displayName = 'Login';
          break;
        case 'register':
          displayName = 'Register';
          break;
        case 'about':
          displayName = 'About';
          break;
        case 'customer-review':
          displayName = 'Customer Reviews';
          break;
        case 'manager-review':
          displayName = 'Manager Reviews';
          break;
        default:
          // Convert kebab-case to Title Case
          displayName = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }

      items.push({
        name: displayName,
        path: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => (
          <li key={item.path} className="breadcrumb-item">
            {item.isLast ? (
              <span className="breadcrumb-current" aria-current="page">
                {item.name}
              </span>
            ) : (
              <>
                <Link to={item.path} className="breadcrumb-link">
                  {item.name}
                </Link>
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
