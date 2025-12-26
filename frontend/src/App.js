import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetails from './pages/projects/ProjectDetails';
import UserList from './pages/users/UserList';
import TenantList from './pages/tenants/TenantList';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />

                    <Route path="/projects" element={
                        <ProtectedRoute><ProjectList /></ProtectedRoute>
                    } />

                    <Route path="/projects/:id" element={
                        <ProtectedRoute><ProjectDetails /></ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to="/dashboard" />} />

                    <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />

                    <Route path="/tenants" element={<TenantList />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;