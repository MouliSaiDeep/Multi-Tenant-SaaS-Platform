import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ marginRight: '1rem' }}>SaaS App ({user?.tenant?.name || 'My Tenant'})</strong>

          <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>

          {/* Regular users see Projects */}
          <Link to="/projects" style={{ marginRight: '1rem' }}>Projects</Link>

          {/* Tenant Admins see Users */}
          {user?.role === 'tenant_admin' && <Link to="/users">Users</Link>}

          {/* NEW: Super Admins see Tenants */}
          {user?.role === 'super_admin' && (
            <Link to="/tenants" style={{ color: 'red', fontWeight: 'bold' }}>Manage Tenants</Link>
          )}
        </div>
        <div>
          <span style={{ marginRight: '1rem' }}>{user?.fullName} ({user?.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;