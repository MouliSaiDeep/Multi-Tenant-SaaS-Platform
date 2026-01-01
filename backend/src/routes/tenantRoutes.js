const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// 1. List All Tenants (Super Admin)
router.get('/', tenantController.getAllTenants);

// 2. Upgrade Subscription Plan (Self-Service for Tenant Admins)
// MATCHES FRONTEND: POST /api/tenants/upgrade
router.post('/upgrade', tenantController.upgradePlan);

// 3. Get Specific Tenant Details
router.get('/:tenantId', tenantController.getTenantById);

// 4. Update Tenant Info (Super Admin)
router.put('/:tenantId', tenantController.updateTenant);

module.exports = router;