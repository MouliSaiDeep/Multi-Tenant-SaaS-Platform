import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await api.get('/tenants');
        setTenants(response.data.data);
      } catch (error) {
        alert('Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>Registered Tenants (Super Admin)</h2>
      <table className="table table-bordered table-hover mt-3">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Subdomain</th>
            <th>Plan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.subdomain}</td>
              <td>
                <span className={`badge bg-${tenant.subscription_plan === 'enterprise' ? 'primary' : 'secondary'}`}>
                  {tenant.subscription_plan}
                </span>
              </td>
              <td>{tenant.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TenantList;