const db = require('../config/db');

// API 1: List All Tenants (Super Admin Only)
exports.getAllTenants = async (req, res) => {
  // Security Check
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' });
  }

  try {
    const result = await db.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get Tenants Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 2: Get Single Tenant Details
exports.getTenantById = async (req, res) => {
  const { tenantId } = req.params;

  // Authorization: Users can only view their own tenant (unless Super Admin)
  if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const result = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Update Tenant (Enforcing RBAC Rules)
exports.updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const { name, status, subscription_plan } = req.body;
  const { role, tenantId: userTenantId } = req.user;

  // 1. Authorization Check
  if (role !== 'super_admin' && userTenantId !== tenantId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // 2. RBAC Enforcement (Your Specific Rules)
  // Tenant Admin can ONLY update Name. 
  // If they try to send status or plan, we block it.
  if (role !== 'super_admin') {
    if (status || subscription_plan) {
      return res.status(403).json({
        success: false,
        message: 'Tenant Admins can only update the Organization Name. Contact Super Admin for Plan/Status changes.'
      });
    }
  }

  try {
    // Dynamic Query Construction
    // We only update fields that are provided AND allowed
    let fields = [];
    let values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    // Only Super Admin can update these
    if (role === 'super_admin') {
      if (status) {
        fields.push(`status = $${idx++}`);
        values.push(status);
      }
      if (subscription_plan) {
        fields.push(`subscription_plan = $${idx++}`);
        values.push(subscription_plan);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    values.push(tenantId);
    const query = `UPDATE tenants SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 4: Upgrade Plan (Self-Service)
// Note: While Tenant Admins can't manually edit the "plan" field above, 
// they usually CAN use this specific endpoint to "purchase" an upgrade.
exports.upgradePlan = async (req, res) => {
  const tenantId = req.params.tenantId || req.user.tenantId;
  const { plan } = req.body;

  const PLANS = {
    free: { max_users: 5, max_projects: 3 },
    pro: { max_users: 25, max_projects: 15 },
    enterprise: { max_users: 100, max_projects: 50 }
  };

  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, message: 'Invalid plan selected' });
  }

  try {
    const limits = PLANS[plan];
    const result = await db.query(
      `UPDATE tenants 
       SET subscription_plan = $1, max_users = $2, max_projects = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [plan, limits.max_users, limits.max_projects, tenantId]
    );

    res.status(200).json({ success: true, message: `Upgraded to ${plan}`, data: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};