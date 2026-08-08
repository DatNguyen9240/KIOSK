/**
 * Multi-Tenant Audit Logging Service
 */

import { MEMORY_DB } from '../config/database.js';

export class AuditService {
  static log({ tenantId, userId, action, entityType, entityId, oldData = null, newData = null, ipAddress = '127.0.0.1' }) {
    const entry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: tenantId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      old_data: oldData,
      new_data: newData,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };

    MEMORY_DB.audit_logs.unshift(entry);
    if (MEMORY_DB.audit_logs.length > 1000) MEMORY_DB.audit_logs.pop();
    return entry;
  }

  static getLogs(tenantId, limit = 50) {
    return MEMORY_DB.audit_logs.filter(l => !tenantId || l.tenant_id === tenantId).slice(0, limit);
  }
}
