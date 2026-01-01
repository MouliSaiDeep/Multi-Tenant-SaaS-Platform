import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Layout from '../../components/common/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({ projects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'super_admin') {
      navigate('/tenants');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/projects');
        const projects = projectsRes.data.data;

        const sortedProjects = [...projects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentProjects(sortedProjects.slice(0, 5));

        let allTasks = [];
        for (const proj of sortedProjects) {
          try {
            const tRes = await api.get(`/projects/${proj.id}/tasks`);
            const tData = tRes.data.data.tasks || tRes.data.data;
            allTasks = [...allTasks, ...tData];
          } catch (e) { }
        }

        const completed = allTasks.filter(t => t.status === 'completed').length;
        const total = allTasks.length;
        const pending = total - completed;

        setStats({
          projects: projects.length,
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: pending
        });

        const myPending = allTasks.filter(t => t.assignedTo?.id === user.userId && t.status !== 'completed');
        setMyTasks(myPending.slice(0, 5));

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    if (user && user.role !== 'super_admin') {
      fetchData();
    }
  }, [user]);

  const handleUpgrade = async (plan) => {
    if (!window.confirm(`Upgrade to ${plan}?`)) return;
    try {
      await api.post('/tenants/upgrade', { plan });
      alert('Plan upgraded!');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Upgrade failed');
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' || status === 'completed'
      ? <span className="badge badge-green">{status}</span>
      : <span className="badge badge-gray">{status}</span>;
  };

  // Helper for date format "01 January 2026"
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (user?.role === 'super_admin') return null;

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ marginBottom: '5px' }}>Dashboard</h1>
          <p className="text-muted">Overview of your organization</p>
        </div>
        {/* FIX 2: Specific Date Format */}
        <div className="badge badge-blue" style={{ fontSize: '1rem', padding: '10px 20px', fontWeight: 500 }}>
          {getFormattedDate()}
        </div>
      </div>

      {/* FIX 3: 4-Column Grid for Stats (Eye pleasing layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Active Projects</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.projects}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Total Tasks</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.totalTasks}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Completed</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completedTasks}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Pending</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingTasks}</div>
        </div>
      </div>

      {/* Split Layout: Projects on Left, Subscription on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Recent Projects Table */}
        <div className="card">
          <div className="flex-between mb-3">
            <h3>Recent Projects</h3>
            <Link to="/projects" style={{ fontSize: '0.9rem' }}>View All</Link>
          </div>

          {recentProjects.length === 0 ? <p className="text-muted">No projects yet.</p> : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '10px 0', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>NAME</th>
                  <th style={{ padding: '10px 0', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td style={{ padding: '12px 0' }}>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: '600', color: '#334155' }}>{p.name}</Link>
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FIX 1: Subscription / Upgrade Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="mb-3">Subscription</h3>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '8px', padding: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Current Plan</span>
            <span className="badge badge-yellow" style={{ fontSize: '1.2rem', marginTop: '5px', padding: '5px 15px' }}>
              {user?.tenant?.subscriptionPlan ? user.tenant.subscriptionPlan.toUpperCase() : 'FREE'}
            </span>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            {user?.role === 'tenant_admin' ? (
              <>
                {user?.tenant?.subscriptionPlan !== 'pro' && user?.tenant?.subscriptionPlan !== 'enterprise' && (
                  <button onClick={() => handleUpgrade('pro')} className="btn btn-primary" style={{ width: '100%', marginBottom: '10px' }}>
                    Upgrade to PRO
                  </button>
                )}
                {user?.tenant?.subscriptionPlan !== 'enterprise' && (
                  <button onClick={() => handleUpgrade('enterprise')} className="btn btn-outline" style={{ width: '100%' }}>
                    Upgrade to Enterprise
                  </button>
                )}
                {user?.tenant?.subscriptionPlan === 'enterprise' && (
                  <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>You are on the top tier plan.</p>
                )}
              </>
            ) : (
              <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.85rem' }}>Contact your admin to upgrade.</p>
            )}
          </div>
        </div>
      </div>

      {/* My Tasks Full Width */}
      <div className="card">
        <h3 className="mb-4">My Pending Tasks</h3>
        {myTasks.length === 0 ? <p className="text-muted">No pending tasks assigned to you.</p> : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {myTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #eee', borderRadius: '6px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#3b82f6' }}></div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#334155' }}>{t.title}</div>
                    {/* Date Display */}
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      📅 Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No Date'}
                    </div>
                  </div>
                </div>
                <span className={`badge ${t.priority === 'high' ? 'badge-yellow' : 'badge-gray'}`}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;