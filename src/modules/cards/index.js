/**
 * PARKING Parking Cards Module
 */

import { initMonthlyRenewalModule } from '#modules/monthly-renewal/index.js';

export function initCardsModule(container) {
  if (!container) return;
  initMonthlyRenewalModule(container);
}
