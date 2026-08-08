/**
 * Client-Side Multi-Tenant Context Manager
 */

export const DEFAULT_TENANTS = [
  { id: '11111111-1111-1111-1111-111111111111', code: 'VINHOMES_OCEAN', name: 'Vinhomes Ocean Park', domain: 'vinhomes.kiosk.com' },
  { id: '22222222-2222-2222-2222-222222222222', code: 'MASTERI_WATERFRONT', name: 'Masteri Waterfront', domain: 'masteri.kiosk.com' }
];

class TenantContextManager {
  constructor() {
    this.storageKey = 'parking_go_active_tenant';
    this.activeTenant = this.loadActiveTenant();
    this.listeners = [];
  }

  loadActiveTenant() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore error
      }
    }
    return DEFAULT_TENANTS[0];
  }

  getActiveTenant() {
    return this.activeTenant;
  }

  getActiveTenantId() {
    return this.activeTenant ? this.activeTenant.id : DEFAULT_TENANTS[0].id;
  }

  setActiveTenant(tenant) {
    this.activeTenant = tenant;
    localStorage.setItem(this.storageKey, JSON.stringify(tenant));
    console.log(`[TenantContext] Active Tenant switched to: ${tenant.name} (${tenant.code})`);
    this.notifyListeners(tenant);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(tenant) {
    this.listeners.forEach(fn => fn(tenant));
  }
}

export const tenantContext = new TenantContextManager();
