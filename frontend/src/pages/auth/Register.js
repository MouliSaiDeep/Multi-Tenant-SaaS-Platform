import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    tenantName: '', subdomain: '', adminEmail: '', adminFullName: '', adminPassword: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register-tenant', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Get Started</h2>
          <p className="text-muted">Create your new organization account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Organization Name</label>
              <input name="tenantName" placeholder="Acme Inc." onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Subdomain</label>
              <input name="subdomain" placeholder="acme" onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Admin Name</label>
            <input name="adminFullName" placeholder="John Doe" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Admin Email</label>
            <input name="adminEmail" type="email" placeholder="john@acme.com" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="adminPassword" type="password" placeholder="••••••••" onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Create Account
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.9rem' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;