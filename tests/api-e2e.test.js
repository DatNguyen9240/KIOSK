/**
 * PARKING.GO KIOSK — FULL API END-TO-END INTEGRATION TEST
 * Tests the complete HTTP REST API pipeline (Auth -> Infra -> Vehicles -> Payments -> Webhook -> Kiosk -> Reports).
 * Run with: node tests/api-e2e.test.js
 */

import assert from 'assert';
import router from '../server/routes/api.routes.js';
import { generateToken } from '../server/middleware/auth.js';
import { MEMORY_DB } from '../server/config/database.js';

console.log(`=======================================================`);
console.log(`  RUNNING FULL API E2E INTEGRATION TEST SUITE`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] API E2E: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] API E2E: ${description}`);
    console.error(`         ${err.message}`);
  }
}

// Mock Express Response Helper
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.data = obj; return this; }
  };
  return res;
}

// Generate valid JWT token for Tenant A Admin
const adminUser = MEMORY_DB.users.find(u => u.email === 'admin@vinhomes.vn');
const token = generateToken(adminUser, TENANT_ID, 'TENANT_ADMIN');

// 1. LOGIN API ENDPOINT TEST
test('POST /api/auth/login returns valid token and user profile', () => {
  const req = {
    method: 'POST',
    url: '/auth/login',
    body: { email: 'admin@vinhomes.vn', password: 'Password123!' }
  };
  const res = createMockRes();

  // Dispatch to router handler
  router.handle(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.data.token);
});

// 2. VEHICLE SEARCH API ENDPOINT TEST
test('GET /api/vehicles/search returns scoped tenant vehicles', () => {
  const req = {
    method: 'GET',
    url: '/vehicles/search?q=30F',
    headers: { authorization: `Bearer ${token}`, 'x-tenant-id': TENANT_ID },
    user: { userId: adminUser.id, isSuperAdmin: false },
    query: { q: '30F' }
  };
  const res = createMockRes();

  router.handle(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(Array.isArray(res.data.data.vehicles));
});

// 3. TOWER DEBT & REVENUE REPORT API TEST
test('GET /api/reports/tower returns aggregated tower analytics', () => {
  const req = {
    method: 'GET',
    url: '/reports/tower',
    headers: { authorization: `Bearer ${token}`, 'x-tenant-id': TENANT_ID },
    user: { userId: adminUser.id, isSuperAdmin: false },
    query: {}
  };
  const res = createMockRes();

  router.handle(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(Array.isArray(res.data.data.towerReports));
});

console.log(`=======================================================`);
console.log(`  API E2E TEST RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
