const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController'); // Nested task routes
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply middleware to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// Project Routes
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Nested Task Routes (e.g., POST /api/projects/:projectId/tasks)
router.post('/:projectId/tasks', taskController.createTask);
router.get('/:projectId/tasks', taskController.getTasks);

module.exports = router;