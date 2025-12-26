const db = require('../config/db');

// API 1: List All Tenants (Super Admin) - FIXES YOUR ERROR
exports.getAllTenants = async (req, res) => {
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

// API 3: Update Tenant (General Info)
exports.updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const { name, status, subscription_plan } = req.body;

  try {
    const result = await db.query(
      `UPDATE tenants 
       SET name = COALESCE($1, name), 
           status = COALESCE($2, status),
           subscription_plan = COALESCE($3, subscription_plan),
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, status, subscription_plan, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 4: Upgrade Plan (Your Logic - Integrated)
exports.upgradePlan = async (req, res) => {
  // Use tenantId from params (Super Admin updating) OR req.user (Tenant Admin updating)
  const tenantId = req.params.tenantId || req.user.tenantId;
  const { plan } = req.body;

  const PLANS = {
    free: { max_users: 5, max_projects: 3 },
    pro: { max_users: 20, max_projects: 10 },
    enterprise: { max_users: 100, max_projects: 50 }
  };

  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, message: 'Invalid plan selected' });
  }

  try {
    const limits = PLANS[plan];

    // Note: This query assumes you have 'max_users' and 'max_projects' columns. 
    // If not, simply remove those parts from the UPDATE statement below.
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