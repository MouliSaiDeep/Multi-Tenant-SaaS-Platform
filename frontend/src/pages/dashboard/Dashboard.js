import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Layout from '../../components/common/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({ projects: 0, tasks: 0 });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // FIX: Removed the extra '/api' prefix here
        const projectsRes = await api.get('/projects');
        const projects = projectsRes.data.data;

        const totalProjects = projects.length;
        // Calculate total tasks across all projects
        const totalTasks = projects.reduce((acc, curr) => acc + parseInt(curr.task_count || 0), 0);

        setStats({ projects: totalProjects, tasks: totalTasks });
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      }
    };
    fetchData();
  }, []);

  // NEW: The missing function for handling plan upgrades
  const handleUpgrade = async () => {
    if (!window.confirm("Upgrade to PRO plan (20 Users, 10 Projects)?")) return;

    try {
      // Calls the new backend endpoint we created
      await api.post('/tenants/upgrade', { plan: 'pro' });
      alert('Plan upgraded successfully! Refreshing page...');
      window.location.reload(); // Reloads to show new plan limits
    } catch (err) {
      alert(err.response?.data?.message || 'Upgrade failed');
    }
  };

  return (
    <Layout>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>

        {/* Projects Card */}
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minWidth: '150px' }}>
          <h3>Total Projects</h3>
          <p style={{ fontSize: '24px' }}>{stats.projects}</p>
        </div>

        {/* Tasks Card */}
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minWidth: '150px' }}>
          <h3>Total Tasks</h3>
          <p style={{ fontSize: '24px' }}>{stats.tasks}</p>
        </div>

        {/* Plan Card with Upgrade Button */}
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minWidth: '150px' }}>
          <h3>Current Plan</h3>
          <p style={{ fontSize: '24px', textTransform: 'capitalize' }}>
            {user?.tenant?.subscriptionPlan || 'Free'}
          </p>

          {/* Only show Upgrade button if user is Admin and not already on Pro/Enterprise */}
          {user?.role === 'tenant_admin' && user?.tenant?.subscriptionPlan !== 'pro' && (
            <button
              onClick={handleUpgrade}
              style={{
                marginTop: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Upgrade to Pro
            </button>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;