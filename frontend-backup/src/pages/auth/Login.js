import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', subdomain: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password, formData.subdomain);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Subdomain:</label>
          <input type="text" onChange={(e) => setFormData({...formData, subdomain: e.target.value})} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
        </div>
        <button type="submit">Login</button>
      </form>
      <Link to="/register">Register New Tenant</Link>
    </div>
  );
};

export default Login;