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
        const projectsRes = await api.get('/projects');
        const projects = projectsRes.data.data;
        const totalProjects = projects.length;
        const totalTasks = projects.reduce((acc, curr) => acc + parseInt(curr.task_count || 0), 0);
        setStats({ projects: totalProjects, tasks: totalTasks });
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      }
    };
    fetchData();
  }, []);

  const handleUpgrade = async (planName, description) => {
    if (!window.confirm(`Upgrade to ${planName.toUpperCase()} plan (${description})?`)) return;
    try {
      await api.post('/tenants/upgrade', { plan: planName });
      alert(`Successfully upgraded to ${planName.toUpperCase()}!`);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Upgrade failed');
    }
  };

  // Helper to check if user is admin
  const isAdmin = user?.role === 'tenant_admin';
  const currentPlan = user?.tenant?.subscriptionPlan || 'free';

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Overview of your workspace</p>
        </div>
        <div className="badge badge-blue" style={{ fontSize: '0.9rem', padding: '8px 15px' }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid-3">
        {/* Projects Widget */}
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Active Projects</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: '10px 0' }}>
            {stats.projects}
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>Tracked across your org</div>
        </div>

        {/* Tasks Widget */}
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Tasks</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#059669', margin: '10px 0' }}>
            {stats.tasks}
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>Pending and completed</div>
        </div>

        {/* Plan Widget - DYNAMIC BUTTONS */}
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1rem' }}>Subscription</h3>
            <span className="badge badge-yellow">{currentPlan.toUpperCase()}</span>
          </div>

          <p className="text-muted" style={{ margin: '1rem 0', fontSize: '0.9rem' }}>
            {currentPlan === 'free' && 'Limit: 5 Users, 3 Projects'}
            {currentPlan === 'pro' && 'Limit: 25 Users, 15 Projects'}
            {currentPlan === 'enterprise' && 'Limit: 100 Users, 50 Projects'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Show Upgrade Options if Admin and not on Enterprise */}
            {isAdmin && currentPlan === 'free' && (
              <>
                <button
                  onClick={() => handleUpgrade('pro', '25 Users, 15 Projects')}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  Upgrade to PRO
                </button>
                <button
                  onClick={() => handleUpgrade('enterprise', '100 Users, 50 Projects')}
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  Upgrade to Enterprise
                </button>
              </>
            )}

            {isAdmin && currentPlan === 'pro' && (
              <button
                onClick={() => handleUpgrade('enterprise', '100 Users, 50 Projects')}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                Upgrade to Enterprise
              </button>
            )}

            {(currentPlan === 'enterprise' || !isAdmin) && (
              <button className="btn btn-outline" disabled style={{ width: '100%', fontSize: '0.85rem', opacity: 0.6 }}>
                {isAdmin ? 'Max Plan Active' : 'Contact Admin to Upgrade'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;