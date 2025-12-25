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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowForm(false);
      setNewProject({ name: '', description: '' });
      fetchProjects(); // Refresh list
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Projects</h2>
        <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <div>
            <input 
              placeholder="Project Name" 
              value={newProject.name} 
              onChange={(e) => setNewProject({...newProject, name: e.target.value})} 
              required 
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <textarea 
              placeholder="Description" 
              value={newProject.description} 
              onChange={(e) => setNewProject({...newProject, description: e.target.value})} 
            />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Save Project</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map(project => (
          <div key={project.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <span style={{ backgroundColor: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
              {project.status}
            </span>
            <div style={{ marginTop: '10px' }}>
                <Link to={`/projects/${project.id}`}>View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ProjectList;