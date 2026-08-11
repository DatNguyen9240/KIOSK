/**
 * PARKING Revenue Management Module
 */

import { initMonthlyRenewalModule } from '#modules/monthly-renewal/index.js';

export function initRevenueModule(container) {
  if (!container) return;
  initMonthlyRenewalModule(container);
}
