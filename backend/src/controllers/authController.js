const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Points to your database config

// API 1: Register Tenant
exports.registerTenant = async (req, res) => {
  // 1. Force lowercase to fix "Demo" vs "demo" issues
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
  const cleanSubdomain = subdomain ? subdomain.trim().toLowerCase() : '';
  const cleanEmail = adminEmail ? adminEmail.trim().toLowerCase() : '';

  const client = await db.pool.connect(); // Start transaction

  try {
    await client.query('BEGIN');

    // 2. Check if Subdomain exists
    const check = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [cleanSubdomain]);
    if (check.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Subdomain already exists' });
    }

    // 3. Create Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan) 
       VALUES ($1, $2, 'active', 'free') RETURNING id`,
      [tenantName, cleanSubdomain]
    );
    const tenantId = tenantRes.rows[0].id;

    // 4. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, 'tenant_admin', true) RETURNING id, email, full_name, role`,
      [tenantId, cleanEmail, hashedPassword, adminFullName]
    );

    await client.query('COMMIT'); // Commit only if BOTH succeed

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { tenantId, subdomain: cleanSubdomain }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Registration Failed:", error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  } finally {
    client.release();
  }
};

// API 2: Login
exports.login = async (req, res) => {
  const { email, password, subdomain } = req.body;
  const cleanSubdomain = subdomain ? subdomain.trim().toLowerCase() : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  try {
    // 1. Find Tenant
    // USE db.query HERE (Not client.query)
    const tenantRes = await db.query('SELECT id, status FROM tenants WHERE subdomain = $1', [cleanSubdomain]);

    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const tenant = tenantRes.rows[0];

    if (tenant.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Tenant account suspended' });
    }

    // 2. Find User
    // USE db.query HERE
    // Note: Checking for 'password' column. If your DB uses 'password_hash', change this word.
    const userRes = await db.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [cleanEmail, tenant.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];

    // 3. Verify Password
    // Use user.password or user.password_hash depending on your DB column
    const dbPassword = user.password || user.password_hash;
    const isMatch = await bcrypt.compare(password, dbPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ success: true, data: { token, user } });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Get Current User
exports.getMe = async (req, res) => {
  try {
    // USE db.query HERE (client is undefined here!)
    const result = await db.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.tenant_id, 
              t.name as tenant_name, t.subscription_plan 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const user = result.rows[0];
    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenant: { name: user.tenant_name, subscriptionPlan: user.subscription_plan }
      }
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};