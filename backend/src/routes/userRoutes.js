const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to params from parent router
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantMiddleware);

// Routes for /api/users (Direct user management)
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;