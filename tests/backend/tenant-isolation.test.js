/**
 * BACKEND TEST 1: MULTI-TENANT ISOLATION & SECURITY TEST
 * Run with: node tests/backend/tenant-isolation.test.js
 */

import assert from 'assert';
import { resolveTenantContext } from '../../server/middleware/tenant-context.js';
import { ParkingFeeService } from '../../server/services/fee-calculator.service.js';
import { PaymentService } from '../../server/services/payment.service.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [BACKEND TEST 1] MULTI-TENANT ISOLATION & SECURITY`);
console.log(`=======================================================`);

let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
  }
}

const TENANT_A_ID = '11111111-1111-1111-1111-111111111111'; // Vinhomes
const TENANT_B_ID = '22222222-2222-2222-2222-222222222222'; // Masteri

test('User A (Vinhomes Admin) requesting Tenant A context is authorized', () => {
  const req = {
    user: { userId: 'a1111111-1111-1111-1111-111111111111', isSuperAdmin: false, activeTenantId: TENANT_A_ID },
    headers: { 'x-tenant-id': TENANT_A_ID },
    query: {}
  };
  const res = {};
  let nextCalled = false;

  resolveTenantContext(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.tenantId, TENANT_A_ID);
});

test('User A (Vinhomes Admin) sending forged X-Tenant-ID: TENANT_B is rejected with 403 Forbidden', () => {
  const req = {
    user: { userId: 'a1111111-1111-1111-1111-111111111111', isSuperAdmin: false, activeTenantId: TENANT_A_ID },
    headers: { 'x-tenant-id': TENANT_B_ID },
    query: {}
  };
  let statusCode = 0;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseData = data; } };
    }
  };

  resolveTenantContext(req, res, () => {});

  assert.strictEqual(statusCode, 403);
  assert.strictEqual(responseData.success, false);
});

test('Super Admin can request access to any valid Tenant context', () => {
  const req = {
    user: { userId: 'a0000000-0000-0000-0000-000000000000', isSuperAdmin: true },
    headers: { 'x-tenant-id': TENANT_B_ID },
    query: {}
  };
  let nextCalled = false;

  resolveTenantContext(req, {}, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.tenantId, TENANT_B_ID);
});

console.log(`=======================================================`);
console.log(`  BACKEND TEST 1 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
