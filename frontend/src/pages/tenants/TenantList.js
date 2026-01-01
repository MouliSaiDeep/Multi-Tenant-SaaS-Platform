import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Layout from '../../components/common/Layout';

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({ subscription_plan: '', status: '' });

  // Add Tenant State
  const [showCreate, setShowCreate] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    tenantName: '', subdomain: '', adminEmail: '', adminPassword: '', adminFullName: ''
  });

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

  useEffect(() => {
    fetchTenants();
  }, []);

  // --- EDIT HANDLERS ---
  const openEditModal = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      subscription_plan: tenant.subscription_plan,
      status: tenant.status
    });
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tenants/${selectedTenant.id}`, formData);
      alert('Tenant updated successfully');
      setShowEdit(false);
      fetchTenants(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  // --- CREATE HANDLERS ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // We use the public register endpoint but stay logged in as Super Admin
      await api.post('/auth/register-tenant', newTenantData);
      alert('Tenant created successfully');
      setShowCreate(false);
      setNewTenantData({ tenantName: '', subdomain: '', adminEmail: '', adminPassword: '', adminFullName: '' });
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.message || 'Creation failed');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1>Registered Tenants</h1>
          <p className="text-muted">Super Admin Management Console</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          + Add New Tenant
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Subdomain</th>
              <th>Subscription</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td style={{ fontWeight: 'bold' }}>{tenant.name}</td>
                <td style={{ color: 'var(--primary)' }}>{tenant.subdomain}</td>
                <td>
                  <span className={`badge ${tenant.subscription_plan === 'enterprise' ? 'badge-blue' :
                      tenant.subscription_plan === 'pro' ? 'badge-green' : 'badge-gray'
                    }`}>
                    {tenant.subscription_plan}
                  </span>
                </td>
                <td>
                  <span className={`badge ${tenant.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => openEditModal(tenant)}
                    className="btn btn-outline"
                    style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {showEdit && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalStyle}>
            <h3>Manage Tenant: {selectedTenant?.name}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Subscription Plan</label>
                <select
                  value={formData.subscription_plan}
                  onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex-gap" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEdit(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {showCreate && (
        <div style={modalOverlayStyle}>
          <div className="card" style={{ ...modalStyle, maxWidth: '500px' }}>
            <h3>Add New Tenant</h3>
            <form onSubmit={handleCreate}>
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Org Name</label>
                  <input required placeholder="Acme Inc" onChange={e => setNewTenantData({ ...newTenantData, tenantName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Subdomain</label>
                  <input required placeholder="acme" onChange={e => setNewTenantData({ ...newTenantData, subdomain: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Admin Name</label>
                <input required placeholder="John Doe" onChange={e => setNewTenantData({ ...newTenantData, adminFullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Admin Email</label>
                <input required type="email" placeholder="admin@acme.com" onChange={e => setNewTenantData({ ...newTenantData, adminEmail: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input required type="password" placeholder="******" onChange={e => setNewTenantData({ ...newTenantData, adminPassword: e.target.value })} />
              </div>
              <div className="flex-gap" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default TenantList;