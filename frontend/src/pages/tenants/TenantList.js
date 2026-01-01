import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Layout from '../../components/common/Layout';

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await api.get('/tenants');
        setTenants(response.data.data);
      } catch (error) { alert('Failed to load tenants'); }
      finally { setLoading(false); }
    };
    fetchTenants();
  }, []);

  if (loading) return <Layout><div className="container mt-4">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h1>Registered Tenants</h1>
        <p className="text-muted">Super Admin Overview</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Subdomain</th>
              <th>Subscription</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td style={{ fontWeight: 'bold' }}>{tenant.name}</td>
                <td style={{ color: 'var(--primary)' }}>{tenant.subdomain}.localhost</td>
                <td>
                  <span className={`badge ${tenant.subscription_plan === 'enterprise' ? 'badge-blue' : 'badge-gray'}`}>
                    {tenant.subscription_plan}
                  </span>
                </td>
                <td><span className="badge badge-green">{tenant.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default TenantList;