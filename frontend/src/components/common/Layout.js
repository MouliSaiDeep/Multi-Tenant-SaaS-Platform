import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  // Helper to determine what text to show under the user's name
  const getOrganizationLabel = () => {
    if (user?.role === 'super_admin') return 'Platform Owner';
    return user?.tenant?.name || 'My Organization';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left: Brand & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            SaaS<span style={{ color: '#1e293b' }}>Platform</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/dashboard" className={isActive('/dashboard')} style={linkStyle}>Dashboard</Link>

            {/* FIX 1: Super Admins should NOT see Projects */}
            {user?.role !== 'super_admin' && (
              <Link to="/projects" className={isActive('/projects')} style={linkStyle}>Projects</Link>
            )}

            {/* Tenant Admins see Team */}
            {user?.role === 'tenant_admin' && (
              <Link to="/users" className={isActive('/users')} style={linkStyle}>Team</Link>
            )}

            {/* Super Admins see Tenants */}
            {user?.role === 'super_admin' && (
              <Link to="/tenants" style={{ ...linkStyle, color: 'var(--danger)' }}>Tenants</Link>
            )}
          </div>
        </div>

        {/* Right: Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.fullName}</div>
            {/* FIX 2: Correctly display Organization Name or 'Platform Owner' */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {getOrganizationLabel()}
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

const linkStyle = {
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  textDecoration: 'none',
  transition: 'color 0.2s'
};

export default Layout;