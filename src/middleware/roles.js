/**
 * Role-based access control middleware
 * Usage: authorizeRoles('admin') or authorizeRoles('admin', 'user')
 * Must be used AFTER the protect middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
