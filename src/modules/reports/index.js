/**
 * PARKING.GO Reports Module
 */

import { initDebtReportModule } from '../debt-report/index.js';

export function initReportsModule(container) {
  if (!container) return;
  initDebtReportModule(container);
}
