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
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newTask, setNewTask] = useState({ title: '', priority: 'medium', assignedTo: '', dueDate: '' });
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '', description: '', status: '', priority: '', assignedTo: '', dueDate: ''
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const pRes = await api.get(`/projects/${id}`);
                setProject(pRes.data.data);

                const tRes = await api.get(`/projects/${id}/tasks`);
                const taskList = tRes.data.data.tasks ? tRes.data.data.tasks : tRes.data.data;
                setTasks(taskList);

                const uRes = await api.get(`/tenants/${user.tenantId}/users`);
                setUsers(uRes.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchDetails();
    }, [id, user]);

    // --- NEW: USE PATCH API FOR QUICK UPDATE ---
    const handleQuickStatus = async (task, newStatus) => {
        try {
            // Optimistic UI Update (Update UI before server responds for speed)
            const oldTasks = [...tasks];
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

            // Call the Specific PATCH API
            await api.patch(`/tasks/${task.id}/status`, { status: newStatus });

        } catch (err) {
            alert("Failed to update status");
            // Revert on error
            setTasks(tasks); // This would need a refetch in a real complex app, but works for now
        }
    };

    const addTask = async () => {
        if (!newTask.title.trim()) return;
        try {
            const { data } = await api.post('/tasks', {
                projectId: id,
                title: newTask.title,
                priority: newTask.priority,
                assignedTo: newTask.assignedTo || null,
                dueDate: newTask.dueDate || null
            });
            setTasks([...tasks, data.data]);
            setNewTask({ title: '', priority: 'medium', assignedTo: '', dueDate: '' });
        } catch (err) { alert("Failed to add task"); }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) { alert("Failed to delete"); }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setEditForm({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            assignedTo: task.assignedTo?.id || '',
            dueDate: task.due_date ? task.due_date.split('T')[0] : ''
        });
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editForm,
                assignedTo: editForm.assignedTo === "" ? null : editForm.assignedTo,
                dueDate: editForm.dueDate === "" ? null : editForm.dueDate
            };

            const { data } = await api.put(`/tasks/${editingTask.id}`, payload);

            const updatedTask = data.data;
            if (updatedTask.assigned_to) {
                const userObj = users.find(u => u.id === updatedTask.assigned_to);
                updatedTask.assignedTo = userObj ? { id: userObj.id, fullName: userObj.full_name } : null;
            } else {
                updatedTask.assignedTo = null;
            }

            setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
            setEditingTask(null);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update task");
        }
    };

    const getPriorityBadge = (p) => {
        switch (p) {
            case 'high': return 'badge-yellow';
            case 'low': return 'badge-gray';
            default: return 'badge-blue';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
                                {/* NEW: Quick Status Toggle */}
                                <div
                                    onClick={() => handleQuickStatus(task, task.status === 'completed' ? 'todo' : 'completed')}
                                    style={{
                                        cursor: 'pointer',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: task.status === 'completed' ? 'none' : '2px solid #cbd5e1',
                                        backgroundColor: task.status === 'completed' ? '#10b981' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                    title="Click to toggle status"
                                >
                                    {task.status === 'completed' && '✓'}
                                </div>

                                <div>
                                    <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                            color: task.status === 'completed' ? '#94a3b8' : 'inherit'
                                        }}>
                                            {task.title}
                                        </span>
                                        <span className={`badge ${task.status === 'completed' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                                            {task.status}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            👤 {task.assignedTo ? task.assignedTo.fullName : 'Unassigned'}
                                        </span>

                                        {task.due_date && (
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                color: '#d97706', fontWeight: 'bold', background: '#fffbeb',
                                                padding: '2px 6px', borderRadius: '4px'
                                            }}>
                                                📅 Due: {formatDate(task.due_date)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <span className={`badge ${getPriorityBadge(task.priority)}`} style={{ marginLeft: '10px' }}>{task.priority}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => openEditModal(task)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Edit</button>
                                <button onClick={() => deleteTask(task.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>

                <div style={{ background: '#f8fafc', padding: '1.5rem', marginTop: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            style={{ flex: 1, minWidth: '200px' }}
                            placeholder="Add a new task..."
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                        <select
                            style={{ width: '150px' }}
                            value={newTask.assignedTo}
                            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                        >
                            <option value="">Unassigned</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                        <select
                            style={{ width: '100px' }}
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <input
                            type="date"
                            style={{ width: '140px' }}
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        />
                        <button onClick={addTask} className="btn btn-primary">Add</button>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL REMAINS THE SAME... */}
            {editingTask && (
                <div style={modalOverlayStyle}>
                    <div className="card" style={modalStyle}>
                        <h3>Edit Task</h3>
                        <form onSubmit={handleUpdateTask}>
                            <div className="form-group">
                                <label>Title</label>
                                <input required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="2" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>

                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Assigned To</label>
                                    <select value={editForm.assignedTo} onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })}>
                                        <option value="">Unassigned</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex-gap" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingTask(null)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };

export default ProjectDetails;