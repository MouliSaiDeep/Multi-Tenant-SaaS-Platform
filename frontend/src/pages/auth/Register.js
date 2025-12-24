import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

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

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="container">
      <h2>Register Organization</h2>
      <form onSubmit={handleSubmit}>
        <input name="tenantName" placeholder="Organization Name" onChange={handleChange} required />
        <input name="subdomain" placeholder="Subdomain" onChange={handleChange} required />
        <input name="adminFullName" placeholder="Admin Name" onChange={handleChange} required />
        <input name="adminEmail" placeholder="Admin Email" type="email" onChange={handleChange} required />
        <input name="adminPassword" placeholder="Password" type="password" onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;