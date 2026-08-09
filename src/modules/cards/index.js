/**
 * PARKING.GO Parking Cards Module
 */

import { initMonthlyRenewalModule } from '../monthly-renewal/index.js';

export function initCardsModule(container) {
  if (!container) return;
  initMonthlyRenewalModule(container);
}
