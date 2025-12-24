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
        // Fetch projects to calculate stats
        const projectsRes = await api.get('/api/projects');
        const projects = projectsRes.data.data;
        
        // Simple calculation for demo purposes
        const totalProjects = projects.length;
        const totalTasks = projects.reduce((acc, curr) => acc + parseInt(curr.task_count || 0), 0);

        setStats({ projects: totalProjects, tasks: totalTasks });
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Total Projects</h3>
          <p style={{ fontSize: '24px' }}>{stats.projects}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Total Tasks</h3>
          <p style={{ fontSize: '24px' }}>{stats.tasks}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
           <h3>Plan</h3>
           <p style={{ fontSize: '24px' }}>{user?.tenant?.subscriptionPlan || 'Free'}</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;