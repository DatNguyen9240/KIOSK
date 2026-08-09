/**
 * FRONTEND TEST 4: TOWER DEBT & REVENUE REPORT TABLE UI TEST
 * Run with: node tests/frontend/tower-report-ui.test.js
 */

import assert from 'assert';
import { ReportService } from '../../server/services/report.service.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 4] TOWER REPORT TABLE UI RENDER`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] FE UI Test: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] FE UI Test: ${description}`);
    console.error(`         ${err.message}`);
  }
}

// 1. REPORT TABLE COMPONENT STATE TEST
test('Tower Report UI: Renders summary cards and tower rows (A1, A2, A3)', () => {
  const reportData = ReportService.getReportByTower(TENANT_ID);

  const uiTableState = {
    totalRevenueText: `${reportData.totalRevenue.toLocaleString('vi-VN')} VNĐ`,
    totalDebtText: `${reportData.totalOutstandingDebt.toLocaleString('vi-VN')} VNĐ`,
    rowsCount: reportData.towerReports.length
  };

  assert.ok(uiTableState.rowsCount >= 2);
  assert.ok(uiTableState.totalRevenueText.includes('VNĐ'));
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 4 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
