const db = require('../config/db');

// API 12: Create Project (Enforces Subscription Limits)
exports.createProject = async (req, res) => {
  const { name, description, status } = req.body;
  
  // LOG 1: Check what data came from the frontend
  console.log("Body:", req.body);
  console.log("User Context:", req.user);

  const { tenantId, userId } = req.user;

  try {
    // 1. Check Subscription Limits
     const limitRes = await db.query(
      `SELECT t.max_projects, count(p.id) as current_count 
       FROM tenants t 
       LEFT JOIN projects p ON p.tenant_id = t.id 
       WHERE t.id = $1 
       GROUP BY t.max_projects`,
      [tenantId]
    );

    // LOG 2: Check if the tenant was found
    if (limitRes.rows.length === 0) {
        console.error("ERROR: Tenant not found in DB or Query returned no rows");
        return res.status(500).json({ success: false, message: 'Tenant lookup failed' });
    }

    const { max_projects, current_count } = limitRes.rows[0];
    
    if (parseInt(current_count) >= max_projects) {
       return res.status(403).json({ 
        success: false, 
        message: 'Subscription limit reached.' 
      });
    }

    // 2. Create Project
    const result = await db.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, name, description, status || 'active', userId]
    );

    // 3. Audit Log
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'CREATE_PROJECT', 'project', $3)`,
      [tenantId, userId, result.rows[0].id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    // LOG 3: The actual error
    console.error("!!! FATAL ERROR IN CREATE PROJECT !!!");
    console.error(error); 
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 13: List Projects (Scoped to Tenant)
exports.getProjects = async (req, res) => {
  const { tenantId } = req.user;
  const { search, status } = req.query;

  try {
    let queryText = `
      SELECT p.*, u.full_name as creator_name,
      (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) as task_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND p.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    const result = await db.query(queryText, params);
    
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 14: Update Project
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  const { tenantId, role, userId } = req.user;

  try {
    // Check ownership or admin role 
    const projectCheck = await db.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (projectCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

    if (role !== 'tenant_admin' && projectCheck.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    const result = await db.query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [name, description, status, id, tenantId]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 15: Delete Project
exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const { tenantId, role } = req.user;

  if (role !== 'tenant_admin') {
    return res.status(403).json({ success: false, message: 'Only admins can delete projects' });
  }

  try {
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

    // Audit Log
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'DELETE_PROJECT', 'project', $3)`,
      [tenantId, req.user.userId, id]
    );

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API Get Single Project
exports.getProjectById = async (req, res) => {
    const { id } = req.params;
    const { tenantId } = req.user;

    try {
        const result = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', 
            [id, tenantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};