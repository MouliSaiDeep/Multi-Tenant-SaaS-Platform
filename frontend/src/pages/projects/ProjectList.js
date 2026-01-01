import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/common/Layout';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowForm(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">Manage your ongoing work</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4" style={{ maxWidth: '600px', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New Project</h3>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <input placeholder="Project Name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <textarea placeholder="Description (Optional)" rows="2" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Save Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-3">
        {projects.map(project => (
          <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{project.name}</h3>
              <span className={`badge ${project.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                {project.status}
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.9rem', flex: 1 }}>{project.description || 'No description provided.'}</p>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <Link to={`/projects/${project.id}`} style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ProjectList;