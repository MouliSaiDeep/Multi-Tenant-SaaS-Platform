import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import Layout from '../../components/common/Layout';
import { AuthContext } from '../../context/AuthContext';

const UserList = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);

    // Create State
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', role: 'user' });

    // Edit State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ fullName: '', role: '', isActive: true });

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchUsers = async () => {
        try {
            const { data } = await api.get(`/tenants/${user.tenantId}/users`);
            setUsers(data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (user?.tenantId) fetchUsers(); }, [user]);

    // Handlers
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tenants/${user.tenantId}/users`, newUser);
            setShowCreate(false);
            setNewUser({ email: '', fullName: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Remove user?")) return;
        try {
            await api.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) { alert("Failed to delete"); }
    };

    const openEdit = (u) => {
        setEditingUser(u);
        setEditForm({ fullName: u.full_name, role: u.role, isActive: u.is_active });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put(`/users/${editingUser.id}`, editForm);
            setUsers(users.map(u => u.id === editingUser.id ? data.data : u));
            setEditingUser(null);
        } catch (err) { alert("Update failed"); }
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <Layout>
            <div className="flex-between mb-4">
                <div>
                    <h1>Team Members</h1>
                    <p className="text-muted">Manage access</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Add User</button>
            </div>

            {/* FIX: Improved Styling for Filter Bar */}
            <div className="card mb-4" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        fontSize: '0.95rem'
                    }}
                />
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    style={{
                        width: '200px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        fontSize: '0.95rem',
                        backgroundColor: 'white'
                    }}
                >
                    <option value="all">All Roles</option>
                    <option value="tenant_admin">Admins</option>
                    <option value="user">Users</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No users found.</td></tr>
                        ) : filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: '500' }}>{u.full_name}</td>
                                <td className="text-muted">{u.email}</td>
                                <td>
                                    <span className={`badge ${u.role === 'tenant_admin' ? 'badge-blue' : 'badge-gray'}`}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    {u.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}
                                </td>
                                <td>
                                    {u.id !== user.userId && (
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => openEdit(u)} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Edit</button>
                                            <button onClick={() => handleDelete(u.id)} className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Remove</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE MODAL */}
            {showCreate && (
                <div style={modalOverlay}>
                    <div className="card" style={modalContent}>
                        <h3>Add User</h3>
                        <form onSubmit={handleCreate}>
                            <input placeholder="Full Name" onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} required style={{ width: '100%', marginBottom: '10px' }} />
                            <input placeholder="Email" type="email" onChange={e => setNewUser({ ...newUser, email: e.target.value })} required style={{ width: '100%', marginBottom: '10px' }} />
                            <input placeholder="Password" type="password" onChange={e => setNewUser({ ...newUser, password: e.target.value })} required style={{ width: '100%', marginBottom: '10px' }} />
                            <select onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', marginBottom: '20px' }}>
                                <option value="user">User</option>
                                <option value="tenant_admin">Admin</option>
                            </select>
                            <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingUser && (
                <div style={modalOverlay}>
                    <div className="card" style={modalContent}>
                        <h3>Edit User</h3>
                        <form onSubmit={handleUpdate}>
                            <label>Full Name</label>
                            <input value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} required style={{ width: '100%', marginBottom: '10px' }} />

                            <label>Role</label>
                            <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ width: '100%', marginBottom: '10px' }}>
                                <option value="user">User</option>
                                <option value="tenant_admin">Admin</option>
                            </select>

                            <div style={{ margin: '15px 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        style={{ width: 'auto' }}
                                    />
                                    Active Account
                                </label>
                            </div>

                            <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px' };

export default UserList;