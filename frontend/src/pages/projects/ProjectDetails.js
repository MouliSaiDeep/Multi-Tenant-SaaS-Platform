import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/common/Layout';
import { AuthContext } from '../../context/AuthContext';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [pRes, tRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get(`/projects/${id}/tasks`)
                ]);
                setProject(pRes.data.data);
                setTasks(tRes.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchDetails();
    }, [id, user]);

    const addTask = async () => {
        if (!newTask.title.trim()) return;
        try {
            const { data } = await api.post('/tasks', { projectId: id, ...newTask });
            setTasks([...tasks, data.data]);
            setNewTask({ title: '', priority: 'medium' });
        } catch (err) { alert("Failed to add task"); }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) { alert("Failed to delete"); }
    };

    const getPriorityBadge = (p) => {
        switch (p) {
            case 'high': return 'badge-yellow';
            case 'low': return 'badge-gray';
            default: return 'badge-blue';
        }
    };

    if (loading) return <Layout><div className="container mt-4">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="mb-4">
                <button onClick={() => navigate('/projects')} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginBottom: '1rem' }}>
                    ← Back
                </button>
                <div className="flex-between">
                    <div>
                        <h1>{project?.name}</h1>
                        <p className="text-muted" style={{ fontSize: '1.1rem' }}>{project?.description}</p>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                        {project?.status}
                    </span>
                </div>
            </div>

            <div className="card">
                <h3 className="mb-4" style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    Tasks ({tasks.length})
                </h3>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tasks.length === 0 ? <p className="text-muted" style={{ fontStyle: 'italic', padding: '1rem' }}>No tasks created yet.</p> : tasks.map(task => (
                        <li key={task.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: task.priority === 'high' ? 'var(--warning)' : 'var(--primary)' }}></div>
                                <span style={{ fontWeight: '500' }}>{task.title}</span>
                                <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>

                <div style={{ background: '#f8fafc', padding: '1.5rem', marginTop: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            style={{ flex: 1 }}
                            placeholder="Add a new task..."
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        />
                        <select
                            style={{ width: '150px' }}
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <button onClick={addTask} className="btn btn-primary">Add</button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProjectDetails;