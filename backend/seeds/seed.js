const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@database:5432/saas_db'
});

async function seed() {
  await client.connect();

  try {
    // Clean existing data
    await client.query('TRUNCATE TABLE users, tenants, projects, tasks, audit_logs CASCADE');
    console.log('Tables truncated.');

    const salt = await bcrypt.genSalt(10);
    
    // 1. Super Admin 
    const superAdminPass = await bcrypt.hash('Admin@123', salt);
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, tenant_id)
      VALUES ($1, $2, $3, $4, NULL)
    `, ['superadmin@system.com', superAdminPass, 'Super Admin', 'super_admin']);

    // 2. Tenant: Demo Company 
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, subdomain, status, subscription_plan)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['Demo Company', 'demo', 'active', 'pro']);
    const tenantId = tenantRes.rows[0].id;

    // 3. Tenant Admin 
    const adminPass = await bcrypt.hash('Demo@123', salt);
    const adminRes = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [tenantId, 'admin@demo.com', adminPass, 'Demo Admin', 'tenant_admin']);
    const adminId = adminRes.rows[0].id;

    // 4. Regular Users 
    const userPass = await bcrypt.hash('User@123', salt);
    const user1 = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [tenantId, 'user1@demo.com', userPass, 'User One', 'user']);
    
    const user2 = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [tenantId, 'user2@demo.com', userPass, 'User Two', 'user']);

    // 5. Sample Projects 
    const projectRes = await client.query(`
      INSERT INTO projects (tenant_id, name, description, status, created_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [tenantId, 'Project Alpha', 'Main website redesign', 'active', adminId]);
    const projectId = projectRes.rows[0].id;

    // 6. Sample Tasks 
    await client.query(`
      INSERT INTO tasks (project_id, tenant_id, title, status, priority, assigned_to)
      VALUES 
      ($1, $2, 'Design Database', 'completed', 'high', $3),
      ($1, $2, 'Create API Endpoints', 'in_progress', 'high', $4)
    `, [projectId, tenantId, adminId, user1.rows[0].id]);

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();