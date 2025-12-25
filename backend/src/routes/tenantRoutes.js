const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantMiddleware);

// POST /api/tenants/upgrade
router.post('/upgrade', tenantController.upgradePlan);

module.exports = router;