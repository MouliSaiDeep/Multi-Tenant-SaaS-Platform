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

// Helper to protect routes
const ProtectedRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);
    if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />

                    <Route path="/projects" element={
                        <ProtectedRoute><ProjectList /></ProtectedRoute>
                    } />

                    <Route path="/projects/:id" element={
                        <ProtectedRoute><ProjectDetails /></ProtectedRoute>
                    } />

                    <Route path="/users" element={
                        <ProtectedRoute><UserList /></ProtectedRoute>
                    } />

                    <Route path="/tenants" element={
                        <TenantList /> // Usually also protected, but open in your code
                    } />

                    {/* Default Redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;