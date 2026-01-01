const db = require('../config/db');

// API 16: Create Task
exports.createTask = async (req, res) => {
  const { projectId, title, description, priority, assignedTo, dueDate } = req.body;
  const { tenantId, userId } = req.user;

  try {
    // FIX 1: Sanitize assignedTo (convert "" to null)
    const assigneeId = (assignedTo && assignedTo.trim() !== "") ? assignedTo : null;

    // FIX 2: Sanitize dueDate (convert "" to null). CRITICAL for preventing Server Error.
    const finalDueDate = (dueDate && dueDate.trim() !== "") ? dueDate : null;

    // 1. Verify Project Access
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
      [projectId, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Project not found or access denied' });
    }

    // 2. Validate Assigned User (If provided)
    if (assigneeId) {
      const userCheck = await db.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assigneeId, tenantId]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
      }
    }

    // 3. Create Task
    const result = await db.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, priority, assigned_to, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'todo')
       RETURNING *`,
      [projectId, tenantId, title, description, priority || 'medium', assigneeId, finalDueDate] // Use finalDueDate
    );

    // 4. Audit Log
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

// API 17: List Project Tasks (Fully Implemented)
exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;

  // Extract all filters from query
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

  try {
    // 1. Verify Project Access
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projectCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

    // 2. Build Query
    let queryText = `
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at,
             json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) as "assignedTo"
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1 AND t.tenant_id = $2
    `;

    const params = [projectId, tenantId];
    let paramIndex = 3;

    // Apply Filters
    if (status) {
      queryText += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      queryText += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (priority) {
      queryText += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND t.title ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Pagination Logic
    const limitVal = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * limitVal;

    // Get Total Count (for pagination metadata)
    const countQuery = `SELECT count(*) FROM tasks t WHERE t.project_id = $1 AND t.tenant_id = $2`;
    const countRes = await db.query(countQuery, [projectId, tenantId]);
    const total = parseInt(countRes.rows[0].count);

    // Sorting & Limits
    queryText += ` ORDER BY 
      CASE WHEN t.priority = 'high' THEN 1 WHEN t.priority = 'medium' THEN 2 ELSE 3 END ASC,
      t.due_date ASC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    params.push(limitVal, offset);

    const result = await db.query(queryText, params);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.rows,
        total,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitVal),
          limit: limitVal
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 18: Update Task Status
exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params; // taskId
  const { status } = req.body;
  const { tenantId } = req.user;

  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND tenant_id = $3 RETURNING id, status, updated_at`,
      [status, id, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 19: Update Task (Full Update)
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, assignedTo, dueDate, status } = req.body;
  const { tenantId, userId } = req.user;

  try {
    // FIX 1: Sanitize assignedTo. If it's an empty string, make it NULL.
    const assigneeId = (assignedTo && assignedTo.trim() !== "") ? assignedTo : null;

    // FIX 2: Sanitize dueDate. If it's an empty string, make it NULL.
    const finalDueDate = (dueDate && dueDate.trim() !== "") ? dueDate : null;

    // 1. Verify Assigned User (If changing assignment)
    if (assigneeId) {
      const userCheck = await db.query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [assigneeId, tenantId]);
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
      }
    }

    // 2. Update Query
    const result = await db.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           assigned_to = $4,  -- Updates with UUID or NULL
           due_date = $5,     -- Use strictly the sanitized value (NULL or Date)
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8 
       RETURNING id, title, description, status, priority, assigned_to, due_date, updated_at`,
      [title, description, priority, assigneeId, finalDueDate, status, id, tenantId] // Use finalDueDate
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    // 3. Audit Log (Requirement Met)
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'UPDATE_TASK', 'task', $3)`,
      [tenantId, userId, id]
    );

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  const { tenantId, userId } = req.user;

  try {
    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    // Audit Log
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
          VALUES ($1, $2, 'DELETE_TASK', 'task', $3)`,
      [tenantId, userId, id]
    );

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};