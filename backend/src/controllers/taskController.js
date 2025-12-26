const db = require('../config/db');

// API 16: Create Task
exports.createTask = async (req, res) => {
  // FIX: Read projectId from req.body (Frontend sends it in body), NOT req.params
  const { projectId, title, description, priority, assignedTo, dueDate } = req.body;

  // Ensure we have the user info from the token
  const { tenantId, userId } = req.user;

  try {
    // 1. Verify Project belongs to Tenant 
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
      [projectId, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Project not found or access denied' });
    }

    // 2. Create Task
    const result = await db.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, priority, assigned_to, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'todo')
       RETURNING *`,
      [projectId, tenantId, title, description, priority || 'medium', assignedTo || null, dueDate || null]
    );

    // 3. Audit Log (Optional but good)
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'CREATE_TASK', 'task', $3)`,
      [tenantId, userId, result.rows[0].id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 17: List Tasks by Project
exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;
  const { status, assignedTo } = req.query; // Filters

  try {
    // Verify project access first
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projectCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

    let queryText = `
      SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1 AND t.tenant_id = $2
    `;
    const params = [projectId, tenantId];
    let paramIndex = 3;

    if (status) {
      queryText += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Default Sort: Priority then Due Date 
    queryText += ` ORDER BY 
      CASE WHEN t.priority = 'high' THEN 1 WHEN t.priority = 'medium' THEN 2 ELSE 3 END,
      t.due_date ASC`;

    const result = await db.query(queryText, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 18: Update Task Status
exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { tenantId } = req.user;

  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() 
             WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 19: Update Task (General)
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, assignedTo, dueDate } = req.body;
  const { tenantId } = req.user;

  try {
    const result = await db.query(
      `UPDATE tasks 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 priority = COALESCE($3, priority),
                 assigned_to = $4,
                 due_date = COALESCE($5, due_date),
                 updated_at = NOW()
             WHERE id = $6 AND tenant_id = $7 RETURNING *`,
      [title, description, priority, assignedTo, dueDate, id, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  try {
    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTasks = require('./taskController').getTasks; // Placeholder if you paste partial
exports.updateTaskStatus = require('./taskController').updateTaskStatus;
exports.updateTask = require('./taskController').updateTask;
exports.deleteTask = require('./taskController').deleteTask;