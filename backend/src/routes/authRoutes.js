const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register-tenant', authController.registerTenant);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
// Logout is stateless with JWT, client handles token removal. 
// Optional: Add endpoint for audit logging purposes.
router.post('/logout', authMiddleware, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;