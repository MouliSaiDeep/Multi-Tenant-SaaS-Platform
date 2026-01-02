const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const userRoutes = require('./src/routes/userRoutes');
const tenantUserRoutes = require('./src/routes/tenantUserRoutes');
const tenantRoutes = require('./src/routes/tenantRoutes'); // Fix Import

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Mount Tenant Routes
app.use('/api/tenants', tenantRoutes); // Correctly mounted

// Nested Routes (e.g. /api/tenants/:tenantId/users)
app.use('/api/tenants/:tenantId/users', tenantUserRoutes);

// Health Check 
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./src/config/db');
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;