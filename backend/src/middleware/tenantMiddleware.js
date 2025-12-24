const tenantMiddleware = (req, res, next) => {
  // Super Admins don't always have a tenantId in their token
  if (req.user && req.user.role === 'super_admin') {
    // If super admin wants to act as a specific tenant (optional context), they can pass a header
    // Otherwise, they bypass specific tenant checks
    return next();
  }

  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ success: false, message: 'Tenant context missing' });
  }

  // Inject tenantId for easy access in controllers
  req.tenantId = req.user.tenantId;
  next();
};

module.exports = tenantMiddleware;