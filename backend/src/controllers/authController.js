const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// API 1: Tenant Registration (Transaction Required)
exports.registerTenant = async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan) 
   VALUES ($1, $2, $3, $4) RETURNING id`,
      [tenantName, subdomain, 'active', 'free']
    );
    const tenantId = tenantRes.rows[0].id;

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // 3. Create Admin User
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, 'tenant_admin', true) RETURNING id, email, full_name, role`,
      [tenantId, adminEmail, hashedPassword, adminFullName]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId: tenantId,
        subdomain: subdomain,
        adminUser: userRes.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    // Check for unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Subdomain or email already exists' });
    }
    res.status(400).json({ success: false, message: 'Registration failed', error: error.message });
  } finally {
    client.release();
  }
};

// API 2: User Login
exports.login = async (req, res) => {
  const { email, password, subdomain } = req.body;

  try {
    // 1. Find Tenant by Subdomain
    const tenantRes = await db.query('SELECT id, status FROM tenants WHERE subdomain = $1', [subdomain]);
    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const tenant = tenantRes.rows[0];

    if (tenant.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Tenant account suspended' });
    }

    // 2. Find User in Tenant
    const userRes = await db.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant.id]
    );

    // Handle Super Admin Case (tenant_id is NULL)
    // NOTE: For evaluation simplicity, standard login flow focuses on tenant users. 
    // Super admins might login via a specific "admin" subdomain or separate flow.
    // Here we check standard user logic:

    if (userRes.rows.length === 0) {
      // Check if it's a super admin login (global)
      const superAdminRes = await db.query(
        'SELECT * FROM users WHERE email = $1 AND role = $2',
        [email, 'super_admin']
      );

      if (superAdminRes.rows.length > 0) {
        const superUser = superAdminRes.rows[0];
        const isMatch = await bcrypt.compare(password, superUser.password_hash);
        if (isMatch) {
          const token = jwt.sign(
            { userId: superUser.id, tenantId: null, role: 'super_admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          return res.status(200).json({ success: true, data: { token, user: { ...superUser, password_hash: undefined } } });
        }
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Get Current User (Refreshed from DB)
exports.getMe = async (req, res) => {
  try {
    // Query DB to get the LATEST tenant plan details
    // We join users with tenants to get the fresh subscription_plan
    const result = await client.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.tenant_id, 
              t.name as tenant_name, t.subscription_plan 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

    // reconstruct the user object for the frontend
    const freshUserData = {
      userId: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenant: {
        name: user.tenant_name,
        subscriptionPlan: user.subscription_plan // <--- This will now be 'pro'
      }
    };

    res.status(200).json({ success: true, data: freshUserData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};