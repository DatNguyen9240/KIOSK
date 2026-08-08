/**
 * Role-Based Access Control (RBAC) & Fine-grained Permission Middleware
 */

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (user.isSuperAdmin) {
      return next(); // Super admin bypasses permission checks
    }

    // Role-permission map check
    const rolePermissions = {
      'TENANT_ADMIN': ['*'],
      'PARKING_MANAGER': ['vehicle.read', 'vehicle.create', 'vehicle.update', 'parking_session.read', 'parking_session.create', 'parking_session.checkout', 'tariff.read', 'tariff.update', 'voucher.read', 'payment.read'],
      'GATE_OPERATOR': ['vehicle.read', 'parking_session.read', 'parking_session.create', 'parking_session.checkout'],
      'VIEWER': ['vehicle.read', 'parking_session.read', 'payment.read', 'tariff.read']
    };

    const userRole = user.role || 'VIEWER';
    const allowedPermissions = rolePermissions[userRole] || [];

    if (allowedPermissions.includes('*') || allowedPermissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Missing required permission [${permissionCode}]`
    });
  };
}
