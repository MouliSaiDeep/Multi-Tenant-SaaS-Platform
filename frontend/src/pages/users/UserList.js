import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import Layout from '../../components/common/Layout';
import { AuthContext } from '../../context/AuthContext';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', role: 'user' });
    const [showForm, setShowForm] = useState(false);
    const { user } = useContext(AuthContext);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get(`/tenants/${user.tenantId}/users`);
            setUsers(data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (user?.tenantId) fetchUsers(); }, [user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tenants/${user.tenantId}/users`, newUser);
            setShowForm(false);
            setNewUser({ email: '', fullName: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) { alert('Failed to add user'); }
    };

    return (
        <Layout>
            <div className="flex-between mb-4">
                <div>
                    <h1>Team Members</h1>
                    <p className="text-muted">Manage access for your organization</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}>
                    {showForm ? 'Cancel' : '+ Add User'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Full Name</label>
                            <input placeholder="Jane Doe" onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Email</label>
                            <input type="email" placeholder="jane@company.com" onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Password</label>
                            <input type="password" placeholder="••••••" onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Role</label>
                            <select onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="user">User</option>
                                <option value="tenant_admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary">Save User</button>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: '500' }}>{u.full_name}</td>
                                <td className="text-muted">{u.email}</td>
                                <td>
                                    <span className={`badge ${u.role === 'tenant_admin' ? 'badge-blue' : 'badge-gray'}`}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td><span className="badge badge-green">Active</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default UserList;