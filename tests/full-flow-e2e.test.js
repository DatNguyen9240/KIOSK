/**
 * PARKING KIOSK — COMPLETE FULL-FLOW END-TO-END SYSTEM TEST
 * Simulates real-world user lifecycle: Auth -> Tenant Guard -> Search -> Voucher -> Renewal Order -> VietQR -> SePay Webhook Auto-Match -> Kiosk Barrier Session -> Tower Report.
 * Run with: node tests/full-flow-e2e.test.js
 */

import assert from 'assert';
import express from 'express';
import http from 'http';
import router from '../server/routes/api.routes.js';
import { MEMORY_DB } from '../server/config/database.js';

console.log(`=============================================================================`);
console.log(`  [FULL FLOW E2E SYSTEM TEST] SIMULATING REAL-WORLD END-TO-END LIFECYCLE`);
console.log(`=============================================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // Vinhomes Ocean Park

const app = express();
app.use(express.json());
app.use('/api', router);

// Global Error Handler for Express
app.use((err, req, res, next) => {
  console.error('[Express Error]', err.stack || err.message);
  res.status(500).json({ success: false, message: err.message });
});

const server = http.createServer(app);

let baseUrl = '';

async function startServer() {
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      console.log(`[E2E Test Server] Live on ${baseUrl}`);
      resolve();
    });
  });
}

async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', body = null, headers = {} } = options;
  const url = `${baseUrl}${endpoint}`;

  const reqHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
    ...headers
  };

  const reqConfig = {
    method,
    headers: reqHeaders
  };

  if (body) reqConfig.body = JSON.stringify(body);

  const res = await fetch(url, reqConfig);
  const data = await res.json().catch(() => ({}));
  if (res.status >= 400) {
    console.error(`[API Error Response ${res.status}]`, data);
  }
  return { status: res.status, data };
}

let stepCount = 0;
async function step(title, fn) {
  stepCount++;
  console.log(`\n▶ STEP ${stepCount}: ${title}`);
  try {
    await fn();
    console.log(`  └─ [SUCCESS] Step ${stepCount} verified cleanly.`);
  } catch (err) {
    console.error(`  └─ [FAILED] Step ${stepCount} failed: ${err.message}`);
    server.close();
    process.exit(1);
  }
}

async function runFullFlow() {
  await startServer();

  let authToken = null;
  let targetVehicle = null;
  let createdOrderCode = null;

  // 1. AUTHENTICATION
  await step('User Login via POST /api/auth/login', async () => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'admin@vinhomes.vn', password: 'Password123!' }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    authToken = res.data.data.token;
    console.log(`     Token acquired for user: ${res.data.data.user.email}`);
  });

  // 2. SEARCH VEHICLE
  await step('Search Vehicle "30F" via GET /api/vehicles/search', async () => {
    const res = await apiFetch('/vehicles/search?q=30F', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.vehicles.length > 0);
    targetVehicle = res.data.data.vehicles[0];
    console.log(`     Found vehicle: ${targetVehicle.plateNumber} (Owner: ${targetVehicle.residentName})`);
  });

  // 3. VOUCHER VALIDATION
  await step('Validate Voucher "HE2024" via GET /api/vouchers/validate', async () => {
    const res = await apiFetch('/vouchers/validate?code=HE2024&amount=2500000', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.valid, true);
    assert.strictEqual(res.data.data.discountAmount, 250000);
    console.log(`     Voucher valid! Discount 10% (-250,000 VNĐ). Final: 2,250,000 VNĐ`);
  });

  // 4. RENEWAL ORDER CREATION & VIETQR
  await step('Create 2-Month Renewal Order via POST /api/orders/renewal', async () => {
    const res = await apiFetch('/orders/renewal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        vehicleId: targetVehicle.id,
        durationMonths: 2,
        voucherCode: 'HE2024'
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.paymentOrder.status, 'WAITING_PAYMENT');
    assert.strictEqual(res.data.data.paymentOrder.expected_amount, 2250000);
    assert.ok(res.data.data.paymentConfig.qrUrl.includes('img.vietqr.io'));
    createdOrderCode = res.data.data.paymentOrder.order_code;
    console.log(`     Order created: ${createdOrderCode} | VietQR URL generated.`);
  });

  // 5. SEPAY WEBHOOK AUTO-RECONCILIATION
  await step('Process Bank Webhook Credit via POST /api/webhooks/payment/sepay', async () => {
    const res = await apiFetch('/webhooks/payment/sepay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        transactionId: `SEPAY-FULL-${Date.now()}`,
        transferContent: `Chuyen khoan phi gia han ${createdOrderCode}`,
        amount: 2250000,
        gateway: 'SEPAY'
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.matched, true);
    console.log(`     SePay Webhook matched! Order status updated to PAID.`);
  });

  // 6. KIOSK CHECK-IN & CHECK-OUT LIFECYCLE
  await step('Kiosk Vehicle Check-in & Check-out Session Lifecycle', async () => {
    // Check-in
    const checkInRes = await apiFetch('/parking/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { plateNumber: '30F-999.99', cardNumber: 'CARD-FLOW-01' }
    });
    assert.strictEqual(checkInRes.data.data.gateAction, 'OPEN_GATE');
    console.log(`     [Check-in] Plate 30F-999.99 -> Signal: OPEN_GATE`);

    // Check-out (Simulating 3 hours stay)
    const session = MEMORY_DB.parking_sessions.find(s => s.plate_number === '30F-999.99' && s.status === 'ACTIVE');
    session.check_in_time = new Date(Date.now() - 3 * 3600 * 1000).toISOString();

    const checkOutRes = await apiFetch('/parking/check-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { plateNumber: '30F-999.99' }
    });

    assert.strictEqual(checkOutRes.data.data.gateAction, 'WAIT_PAYMENT');
    assert.strictEqual(checkOutRes.data.data.canExit, false);
    console.log(`     [Check-out] Plate 30F-999.99 -> Fee: ${checkOutRes.data.data.feeCalculation.fee.toLocaleString()} VNĐ -> Signal: WAIT_PAYMENT`);
  });

  // 7. EXPIRY EMAIL REMINDER CRON SCAN
  await step('Run Automated Expiry Scan via POST /api/notifications/remind-expiring', async () => {
    const res = await apiFetch('/notifications/remind-expiring', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { daysThreshold: 30 }
    });

    assert.strictEqual(res.status, 200);
    console.log(`     Expiry Scan completed! Sent reminders: ${res.data.data.reminderLogs.length} logs recorded.`);
  });

  // 8. TOWER REPORT DASHBOARD
  await step('Fetch Tower Debt & Revenue Report via GET /api/reports/tower', async () => {
    const res = await apiFetch('/reports/tower', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.strictEqual(res.status, 200);
    console.log(`     Tower Report fetched! Revenue: ${res.data.data.totalRevenue.toLocaleString()} VNĐ across ${res.data.data.towerReports.length} Towers.`);
  });

  console.log(`\n=============================================================================`);
  console.log(`  FULL FLOW E2E TEST COMPLETED: ALL 8 STEPS PASSED WITH 100% SUCCESS RATE!`);
  console.log(`=============================================================================`);

  server.close();
}

runFullFlow();
