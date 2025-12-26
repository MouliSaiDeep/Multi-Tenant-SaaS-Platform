const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// 1. List All Tenants (Matches GET /api/tenants) -> FIXES YOUR ERROR
router.get('/', tenantController.getAllTenants);

// 2. Get Specific Tenant
router.get('/:tenantId', tenantController.getTenantById);

// 3. Update Tenant Info
router.put('/:tenantId', tenantController.updateTenant);

// 4. Upgrade Plan Route (Matches POST /api/tenants/:tenantId/upgrade)
router.post('/:tenantId/upgrade', tenantController.upgradePlan);

module.exports = router;