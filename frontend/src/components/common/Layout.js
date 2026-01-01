import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

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
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mobile Hamburger */}
            <button
              className="btn-outline mobile-only"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ border: 'none', fontSize: '1.2rem', padding: '5px', display: 'none' }}
            >
              ☰
            </button>
            <span>SaaS<span style={{ color: '#1e293b' }}>Platform</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/dashboard" className={isActive('/dashboard')} style={linkStyle}>Dashboard</Link>

            {user?.role !== 'super_admin' && (
              <Link to="/projects" className={isActive('/projects')} style={linkStyle}>Projects</Link>
            )}

            {user?.role === 'tenant_admin' && (
              <Link to="/users" className={isActive('/users')} style={linkStyle}>Team</Link>
            )}

            {user?.role === 'super_admin' && (
              <Link to="/tenants" style={{ ...linkStyle, color: 'var(--danger)' }}>Tenants</Link>
            )}
          </div>
        </div>

        {/* Right: Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', lineHeight: '1.2' }} className="desktop-nav">
            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getOrganizationLabel()}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Menu (Conditionally Rendered) */}
      {isMobileMenuOpen && (
        <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
          {user?.role !== 'super_admin' && <Link to="/projects" onClick={() => setIsMobileMenuOpen(false)}>Projects</Link>}
          {user?.role === 'tenant_admin' && <Link to="/users" onClick={() => setIsMobileMenuOpen(false)}>Team</Link>}
          {user?.role === 'super_admin' && <Link to="/tenants" onClick={() => setIsMobileMenuOpen(false)}>Tenants</Link>}
          <hr style={{ margin: 0, borderColor: '#eee' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Logged in as: <strong>{user?.fullName}</strong>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* Simple Footer */}
      <footer style={{
        padding: '1rem 2rem',
        borderTop: '1px solid #eee',
        fontSize: '0.8rem',
        color: '#64748b',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div>&copy; 2026 SaaS Platform Inc.</div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-only { display: block !important; }
        }
      `}</style>
    </div>
  );
};

const linkStyle = {
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  textDecoration: 'none',
  transition: 'color 0.2s',
  fontWeight: 500
};

export default Layout;