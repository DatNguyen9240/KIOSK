/**
 * PARKING.GO Revenue Management Module
 */

import { initMonthlyRenewalModule } from '../monthly-renewal/index.js';

export function initRevenueModule(container) {
  if (!container) return;
  initMonthlyRenewalModule(container);
}
