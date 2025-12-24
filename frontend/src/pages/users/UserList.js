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
            // Need tenantId to fetch users. Assuming user object has tenantId or fetching from /me
            const { data } = await api.get(`/api/tenants/${user.tenantId}/users`);
            setUsers(data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user && user.tenantId) fetchUsers();
    }, [user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/tenants/${user.tenantId}/users`, newUser);
            setShowForm(false);
            setNewUser({ email: '', fullName: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add user');
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Team Members</h2>
                <button onClick={() => setShowForm(!showForm)}>+ Add User</button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc' }}>
                    <input placeholder="Full Name" onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required />
                    <input placeholder="Email" type="email" onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                    <input placeholder="Password" type="password" onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                    <select onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="user">User</option>
                        <option value="tenant_admin">Admin</option>
                    </select>
                    <button type="submit">Save</button>
                </form>
            )}

            <table style={{ width: '100%', marginTop: '20px' }}>
                <thead>
                    <tr style={{ textAlign: 'left' }}><th>Name</th><th>Email</th><th>Role</th></tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Layout>
    );
};

export default UserList;