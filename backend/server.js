const express = require('express');
const cors = require('cors');
require('dotenv').config();
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

const authRoutes = require('./src/routes/authRoutes');
// const tenantRoutes = require('./src/routes/tenantRoutes'); // To be implemented
// const userRoutes = require('./src/routes/userRoutes');     // To be implemented
// const projectRoutes = require('./src/routes/projectRoutes'); // To be implemented

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health Check [cite: 160]
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
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});