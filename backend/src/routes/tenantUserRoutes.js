const express = require('express');
const router = express.Router({ mergeParams: true });
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantMiddleware);

// Routes for /api/tenants/:tenantId/users
router.get('/', userController.getUsers);
router.post('/', userController.addUser);

module.exports = router;