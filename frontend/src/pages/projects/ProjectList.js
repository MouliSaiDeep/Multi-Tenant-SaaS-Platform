import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/common/Layout';
import { AuthContext } from '../../context/AuthContext';

const ProjectList = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'active' });

  // Edit Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProjects(); }, []);

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowCreate(false);
      setNewProject({ name: '', description: '', status: 'active' });
      fetchProjects();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Delete project?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) { alert("Failed to delete"); }
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setEditForm({ name: project.name, description: project.description || '', status: project.status });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/projects/${editingProject.id}`, editForm);
      setProjects(projects.map(p => p.id === editingProject.id ? data.data : p));
      setEditingProject(null);
    } catch (err) { alert("Update failed"); }
  };

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">Manage your ongoing work</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ New Project</button>
      </div>

      {/* Filters Bar */}
      <div className="card mb-4" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* List */}
      {filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No projects found.
        </div>
      ) : (
        <div className="grid-3">
          {filteredProjects.map(project => {
            const canManage = user?.role === 'tenant_admin' || project.created_by === user?.userId;
            return (
              <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between mb-2">
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{project.name}</h3>
                  <span className={`badge ${project.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', flex: 1 }}>
                  {project.description ? (project.description.length > 80 ? project.description.substring(0, 80) + '...' : project.description) : 'No description'}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Tasks: <strong>{project.task_count || 0}</strong>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <Link to={`/projects/${project.id}`} style={{ fontSize: '0.9rem' }}>View Details</Link>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => openEdit(project)} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Edit</button>
                      <button onClick={() => handleDelete(project.id)} className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Del</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={modalOverlay}>
          <div className="card" style={modalContent}>
            <h3>Create Project</h3>
            <form onSubmit={handleCreate}>
              <input placeholder="Name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required className="mb-4" style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
              <textarea placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="mb-4" style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProject && (
        <div style={modalOverlay}>
          <div className="card" style={modalContent}>
            <h3>Edit Project</h3>
            <form onSubmit={handleUpdate}>
              <label>Name</label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

              <label>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />

              <label>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={{ display: 'block', width: '100%', marginBottom: '20px' }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>

              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingProject(null)} className="btn btn-outline">Cancel</button>
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
const modalContent = { background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' };

export default ProjectList;