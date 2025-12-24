const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantMiddleware);

// Direct Task Routes (e.g., PUT /api/tasks/:id)
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

module.exports = router;