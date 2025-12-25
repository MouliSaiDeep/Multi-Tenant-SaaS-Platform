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

    // Fetch Project and Tasks
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const projRes = await api.get(`/projects/${id}`);
                setProject(projRes.data.data);

                const taskRes = await api.get(`/projects/${id}/tasks`);
                setTasks(taskRes.data.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403 || err.response?.status === 404) {
                    navigate('/projects');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, navigate]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post(`/projects/${id}/tasks`, newTask);
            setTasks([...tasks, { ...data.data, assignee_name: 'Unassigned' }]); // Optimistic update
            setNewTask({ title: '', priority: 'medium' });
        } catch (err) {
            alert('Failed to add task');
        }
    };

    const updateStatus = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            console.error('Failed to update status');
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure? This will delete all tasks.')) return;
        try {
            await api.delete(`/projects/${id}`);
            navigate('/projects');
        } catch (err) {
            alert('Failed to delete project');
        }
    };

    if (loading) return <Layout>Loading...</Layout>;
    if (!project) return <Layout>Project not found</Layout>;

    return (
        <Layout>
            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h1>{project.name}</h1>
                    {(user.role === 'tenant_admin' || project.created_by === user.id) && (
                        <button onClick={handleDeleteProject} style={{ backgroundColor: '#ff4444', color: 'white' }}>
                            Delete Project
                        </button>
                    )}
                </div>
                <p>{project.description}</p>
                <span style={{ fontWeight: 'bold' }}>Status: {project.status}</span>
            </div>

            <h3>Tasks</h3>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    placeholder="New Task Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                    style={{ flex: 1 }}
                />
                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <button type="submit">Add Task</button>
            </form>

            {/* Task List */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', backgroundColor: '#f9f9f9' }}>
                        <th style={{ padding: '10px' }}>Title</th>
                        <th style={{ padding: '10px' }}>Priority</th>
                        <th style={{ padding: '10px' }}>Assignee</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{task.title}</td>
                            <td style={{ padding: '10px' }}>{task.priority}</td>
                            <td style={{ padding: '10px' }}>{task.assignee_name || 'Unassigned'}</td>
                            <td style={{ padding: '10px' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                    backgroundColor: task.status === 'completed' ? '#d4edda' : '#fff3cd'
                                }}>
                                    {task.status}
                                </span>
                            </td>
                            <td style={{ padding: '10px' }}>
                                {task.status !== 'completed' && (
                                    <button onClick={() => updateStatus(task.id, 'completed')} style={{ fontSize: '12px' }}>
                                        Mark Complete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Layout>
    );
};

export default ProjectDetails;