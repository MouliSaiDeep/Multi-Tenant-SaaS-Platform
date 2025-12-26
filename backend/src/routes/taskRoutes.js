const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
// const tenantMiddleware = require('../middleware/tenantMiddleware'); // Optional if authMiddleware handles it

router.use(authMiddleware);
// router.use(tenantMiddleware); // Uncomment only if you strictly use it

// 1. CREATE TASK (This was missing!)
router.post('/', taskController.createTask);

// 2. Existing Routes
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

module.exports = router;