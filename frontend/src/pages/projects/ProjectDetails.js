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
    const [error, setError] = useState('');

    // 1. Fetch Project & Tasks
    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const projectRes = await api.get(`/projects/${id}`);
                setProject(projectRes.data.data);

                const tasksRes = await api.get(`/projects/${id}/tasks`);
                setTasks(tasksRes.data.data);
            } catch (err) {
                console.error("Error fetching details:", err);
                setError('Failed to load project details.');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchProjectDetails();
    }, [id, user]);

    // 2. THE MISSING FUNCTION (Restored)
    const addTask = async () => {
        if (!newTask.title.trim()) {
            alert("Please enter a task title");
            return;
        }

        try {
            const { data } = await api.post('/tasks', {
                projectId: id,
                title: newTask.title,
                priority: newTask.priority
            });

            // Update UI immediately
            setTasks([...tasks, data.data]);
            setNewTask({ title: '', priority: 'medium' }); // Reset form
        } catch (err) {
            console.error("Failed to add task:", err);
            alert("Failed to add task. Check console for details.");
        }
    };

    // 3. Delete Task Helper
    const deleteTask = async (taskId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            alert("Failed to delete task");
        }
    };

    if (loading) return <Layout><div>Loading...</div></Layout>;
    if (error) return <Layout><div style={{color: 'red'}}>{error}</div></Layout>;

    return (
        <Layout>
            <button onClick={() => navigate('/projects')} style={{ marginBottom: '20px', padding: '5px 10px', cursor: 'pointer' }}>
                ← Back to Projects
            </button>

            {project && (
                <div style={{ marginBottom: '30px' }}>
                    <h2>{project.name}</h2>
                    <p style={{ color: '#666' }}>{project.description}</p>
                    <span style={{ 
                        background: project.status === 'active' ? '#d4edda' : '#f8d7da', 
                        padding: '5px 10px', 
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {project.status.toUpperCase()}
                    </span>
                </div>
            )}

            <h3>Tasks</h3>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {tasks.length === 0 ? <p style={{ fontStyle: 'italic', color: '#888' }}>No tasks yet.</p> : tasks.map(task => (
                    <li key={task.id} style={{ 
                        border: '1px solid #eee', 
                        padding: '15px', 
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div>
                            <strong>{task.title}</strong>
                            <span style={{ 
                                marginLeft: '10px', 
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: task.priority === 'high' ? '#ffeeba' : '#e2e3e5',
                                color: task.priority === 'high' ? '#856404' : '#383d41'
                            }}>
                                {task.priority.toUpperCase()}
                            </span>
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>

            {/* Add Task Form - FIXED STYLE */}
            <div style={{ 
                marginTop: '30px', 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'center',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px'
            }}>
                <input 
                    type="text" 
                    placeholder="New Task Title..." 
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    // THE UI FIX: flex: 1 makes it expand to fill space
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
                >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                </select>
                <button 
                    onClick={addTask}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Add Task
                </button>
            </div>
        </Layout>
    );
};

export default ProjectDetails;