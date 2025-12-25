const db = require('../config/db');

exports.upgradePlan = async (req, res) => {
  const { tenantId } = req.user;
  const { plan } = req.body; // 'pro' or 'enterprise'

  // Define plan limits
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
    
    // Update tenant record
    const result = await db.query(
      `UPDATE tenants 
       SET subscription_plan = $1, max_users = $2, max_projects = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [plan, limits.max_users, limits.max_projects, tenantId]
    );

    res.status(200).json({ 
      success: true, 
      message: `Upgraded to ${plan}`, 
      data: result.rows[0] 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};