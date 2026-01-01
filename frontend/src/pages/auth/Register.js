import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminFullName: '',
    adminPassword: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // Obscure Text Settings (Show/Hide)
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Client-Side Validation
    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.agreeTerms) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register-tenant', {
        tenantName: formData.tenantName,
        subdomain: formData.subdomain,
        adminEmail: formData.adminEmail,
        adminFullName: formData.adminFullName,
        adminPassword: formData.adminPassword
      });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Error registering');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Register Organization</h2>
          <p className="text-muted">Create your workspace</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name</label>
            <input name="tenantName" placeholder="Acme Inc." onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Subdomain</label>
            <input name="subdomain" placeholder="acme" onChange={handleChange} required />
            {/* Subdomain Preview */}
            {formData.subdomain && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Preview: <strong>{formData.subdomain}.yourapp.com</strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Admin Full Name</label>
            <input name="adminFullName" placeholder="John Doe" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Admin Email</label>
            <input name="adminEmail" type="email" placeholder="john@acme.com" onChange={handleChange} required />
          </div>

          {/* Password with Show/Hide Toggle */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Password</label>
            <input
              name="adminPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '10px', top: '32px',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

           <div className="form-group" style={{ position: 'relative' }}>
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '10px', top: '32px',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>


          {/* Terms & Conditions */}
          <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="checkbox"
              name="agreeTerms"
              id="terms"
              onChange={handleChange}
              style={{ width: 'auto' }}
            />
            <label htmlFor="terms" style={{ marginBottom: 0, fontWeight: 'normal', fontSize: '0.9rem' }}>
              I agree to the <a href="#">Terms & Conditions</a>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" style={{ fontWeight: '600' }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;