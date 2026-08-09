/**
 * BACKEND TEST 5: API E2E INTEGRATION TEST
 * Run with: node tests/backend/api-e2e.test.js
 */

import assert from 'assert';
import router from '../../server/routes/api.routes.js';
import { generateToken } from '../../server/middleware/auth.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [BACKEND TEST 5] API E2E REST PIPELINE INTEGRATION`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
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

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.data = obj; return this; }
  };
}

const adminUser = MEMORY_DB.users.find(u => u.email === 'admin@vinhomes.vn');
const token = generateToken(adminUser, TENANT_ID, 'TENANT_ADMIN');

test('POST /api/auth/login returns valid JWT token', () => {
  const req = { method: 'POST', url: '/auth/login', body: { email: 'admin@vinhomes.vn', password: 'Password123!' } };
  const res = createMockRes();
  router.handle(req, res, () => {});
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.data.data.token);
});

test('GET /api/vehicles/search returns tenant vehicles', () => {
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
  assert.ok(Array.isArray(res.data.data.vehicles));
});

test('GET /api/reports/tower returns aggregated tower report', () => {
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
  assert.ok(Array.isArray(res.data.data.towerReports));
});

console.log(`=======================================================`);
console.log(`  BACKEND TEST 5 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
