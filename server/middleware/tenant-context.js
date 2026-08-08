/**
 * Server-Side Tenant Context Middleware
 * Enforces strict Tenant Isolation Security Boundaries.
 */

import { MEMORY_DB } from '../config/database.js';

export function resolveTenantContext(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  // Requested tenant ID from header or query (discovery metadata)
  const requestedTenantId = req.headers['x-tenant-id'] || req.query.tenant_id;

  // Super Admin can access any registered tenant
  if (user.isSuperAdmin) {
    const activeTenantId = requestedTenantId || user.activeTenantId || MEMORY_DB.tenants[0].id;
    const tenantExists = MEMORY_DB.tenants.find(t => t.id === activeTenantId || t.code === activeTenantId);
    
    if (!tenantExists) {
      return res.status(404).json({ success: false, message: `Tenant [${activeTenantId}] not found` });
    }

    req.tenantId = tenantExists.id;
    req.tenant = tenantExists;
    req.isSuperAdmin = true;
    return next();
  }

  // For regular users, validate tenant membership against tenant_users authorization records
  const userTenantMemberships = MEMORY_DB.tenant_users.filter(tu => tu.user_id === user.userId);
  const authorizedTenantIds = userTenantMemberships.map(tu => tu.tenant_id);

  let targetTenantId = requestedTenantId || user.activeTenantId;

  // If user requested a tenant ID, check if user is a valid member of that tenant
  if (requestedTenantId) {
    const match = MEMORY_DB.tenants.find(t => t.id === requestedTenantId || t.code === requestedTenantId);
    if (match) targetTenantId = match.id;

    if (!authorizedTenantIds.includes(targetTenantId)) {
      console.warn(`[Security Alert] User ${user.email} attempted unauthorized access to Tenant ${requestedTenantId}`);
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have membership or authorization for the requested Tenant'
      });
    }
  } else {
    targetTenantId = authorizedTenantIds[0] || user.activeTenantId;
  }

  if (!targetTenantId) {
    return res.status(403).json({ success: false, message: 'No authorized tenant assigned to this user' });
  }

  const tenant = MEMORY_DB.tenants.find(t => t.id === targetTenantId);
  req.tenantId = targetTenantId;
  req.tenant = tenant;
  req.isSuperAdmin = false;
  next();
}
