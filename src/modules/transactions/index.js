/**
 * PARKING.GO Transactions Log Module
 */

import { initMonthlyRenewalModule } from '#modules/monthly-renewal/index.js';

export function initTransactionsModule(container) {
  if (!container) return;
  initMonthlyRenewalModule(container);
}
