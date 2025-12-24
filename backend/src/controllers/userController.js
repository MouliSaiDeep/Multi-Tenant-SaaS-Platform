const db = require('../config/db');
const bcrypt = require('bcryptjs');

// API 8: Add User to Tenant (Enforces Subscription Limits)
exports.addUser = async (req, res) => {
    const { email, password, fullName, role } = req.body;
    const { tenantId, userId } = req.user;

    // Only tenant_admin can create users
    if (req.user.role !== 'tenant_admin') {
        return res.status(403).json({ success: false, message: 'Only tenant admins can add users' });
    }

    try {
        // 1. Check Subscription Limits 
        // Get tenant's max_users and current user count
        const limitRes = await db.query(
            `SELECT t.max_users, count(u.id) as current_count 
       FROM tenants t 
       LEFT JOIN users u ON u.tenant_id = t.id 
       WHERE t.id = $1 
       GROUP BY t.max_users`,
            [tenantId]
        );

        const { max_users, current_count } = limitRes.rows[0];

        if (parseInt(current_count) >= max_users) {
            return res.status(403).json({
                success: false,
                message: 'Subscription user limit reached. Upgrade plan to add more users.'
            });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create User
        const result = await db.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
            [tenantId, email, hashedPassword, fullName, role || 'user']
        );

        // 4. Audit Log
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'CREATE_USER', 'user', $3)`,
            [tenantId, userId, result.rows[0].id]
        );

        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (error) {
        // Unique constraint violation (email + tenant_id)
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// API 9: List Tenant Users
exports.getUsers = async (req, res) => {
    const { tenantId } = req.user;
    const { search, role } = req.query;

    try {
        let queryText = `
      SELECT id, email, full_name, role, is_active, created_at 
      FROM users 
      WHERE tenant_id = $1
    `;
        const params = [tenantId];
        let paramIndex = 2;

        if (search) {
            queryText += ` AND (email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            queryText += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC`;

        const result = await db.query(queryText, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// API 10: Update User
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { fullName, role, isActive } = req.body;
    const currentUser = req.user;

    // Authorization Check 
    // Only tenant_admin can update anyone; users can only update themselves (limited fields)
    if (currentUser.role !== 'tenant_admin' && currentUser.userId !== id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    try {
        // If not admin, restrict fields (e.g., user can't change their own role/status)
        let queryText = 'UPDATE users SET updated_at = NOW()';
        const params = [id, currentUser.tenantId];
        let paramIndex = 3;

        if (fullName) {
            queryText += `, full_name = $${paramIndex}`;
            params.push(fullName);
            paramIndex++;
        }

        // Only Admin can update role and active status
        if (currentUser.role === 'tenant_admin') {
            if (role) {
                queryText += `, role = $${paramIndex}`;
                params.push(role);
                paramIndex++;
            }
            if (isActive !== undefined) {
                queryText += `, is_active = $${paramIndex}`;
                params.push(isActive);
                paramIndex++;
            }
        }

        queryText += ` WHERE id = $1 AND tenant_id = $2 RETURNING id, full_name, role, is_active`;

        const result = await db.query(queryText, params);

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// API 11: Delete User
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const { tenantId, userId } = req.user;

    if (req.user.role !== 'tenant_admin') {
        return res.status(403).json({ success: false, message: 'Only admins can delete users' });
    }

    // Prevent self-deletion 
    if (id === userId) {
        return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    try {
        // Standard delete (Tasks will set NULL via CASCADE/SET NULL in DB schema)
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
            [id, tenantId]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        // Audit Log
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'DELETE_USER', 'user', $3)`,
            [tenantId, userId, id]
        );

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};