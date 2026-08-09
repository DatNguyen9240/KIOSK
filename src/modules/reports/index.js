/**
 * PARKING.GO Reports Module
 */

import { initDebtReportModule } from '#modules/debt-report/index.js';

export function initReportsModule(container) {
  if (!container) return;
  initDebtReportModule(container);
}
