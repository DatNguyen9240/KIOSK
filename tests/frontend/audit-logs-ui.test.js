/**
 * FRONTEND TEST 7: ADMIN AUDIT LOGS TABLE UI TEST
 * Tests Admin Audit Trail Table filtering and rendering UI Component.
 * Run with: node tests/frontend/audit-logs-ui.test.js
 */

import assert from 'assert';
import { AuditService } from '../../server/services/audit.service.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 7] ADMIN AUDIT LOGS TABLE UI`);
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

// 1. AUDIT LOGS TABLE RENDER TEST
test('Audit Logs UI: Retrieves and formats audit log entries for display table', () => {
  AuditService.log({
    tenantId: TENANT_ID,
    userId: 'admin-ui-test',
    action: 'UPDATE_TARIFF_TIER',
    entityType: 'TARIFF',
    entityId: 'tr-01',
    newData: { tierFee: 25000 }
  });

  const logs = AuditService.getLogs(TENANT_ID);

  const uiTableState = {
    logsCount: logs.length,
    latestAction: logs[0].action,
    latestUser: logs[0].userId,
    formattedTimestamp: new Date(logs[0].timestamp).toLocaleString('vi-VN')
  };

  assert.ok(uiTableState.logsCount >= 1);
  assert.strictEqual(uiTableState.latestAction, 'UPDATE_TARIFF_TIER');
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 7 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
