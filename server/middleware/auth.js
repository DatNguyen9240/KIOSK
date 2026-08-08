let jwt = null;
try {
  jwt = (await import('jsonwebtoken')).default;
} catch (e) {
  // fallback simple token handler for zero-dependency test execution
}

const JWT_SECRET = process.env.JWT_SECRET || 'PARKING_GO_SUPER_SECRET_KEY_2026';

export function generateToken(user, tenantId = null, role = 'VIEWER') {
  if (jwt) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.fullName || user.full_name,
        isSuperAdmin: !!user.isSuperAdmin || !!user.is_super_admin,
        activeTenantId: tenantId,
        role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  return `mock-token-${user.id}-${tenantId}`;
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Demo fallback: default anonymous context if no token passed in demo environment
    req.user = {
      userId: 'a1111111-1111-1111-1111-111111111111',
      email: 'admin@vinhomes.vn',
      fullName: 'Nguyễn Quản Lý (Vinhomes)',
      isSuperAdmin: false,
      activeTenantId: '11111111-1111-1111-1111-111111111111',
      role: 'TENANT_ADMIN'
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}
