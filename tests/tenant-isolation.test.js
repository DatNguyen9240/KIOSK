/**
 * PARKING.GO KIOSK — MULTI-TENANT ISOLATION & SECURITY TEST SUITE
 * Run with: node tests/tenant-isolation.test.js
 */

import assert from 'assert';
import { resolveTenantContext } from '../server/middleware/tenant-context.js';
import { ParkingFeeService } from '../server/services/fee-calculator.service.js';
import { PaymentService } from '../server/services/payment.service.js';
import { MEMORY_DB } from '../server/config/database.js';

console.log(`=======================================================`);
console.log(`  RUNNING PARKING.GO MULTI-TENANT ISOLATION TESTS`);
console.log(`=======================================================`);

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// TEST GROUP 1: TENANT SECURITY BOUNDARY & ISOLATION
// -----------------------------------------------------------------------------
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

  assert.strictEqual(nextCalled, true, 'Next middleware should be called');
  assert.strictEqual(req.tenantId, TENANT_A_ID, 'Tenant ID should be resolved to Tenant A');
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
      return {
        json: (data) => { responseData = data; }
      };
    }
  };

  resolveTenantContext(req, res, () => {});

  assert.strictEqual(statusCode, 403, 'Should reject forged tenant header with 403 Forbidden');
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
  assert.strictEqual(req.tenantId, TENANT_B_ID, 'Super Admin should switch to requested Tenant B');
});

// -----------------------------------------------------------------------------
// TEST GROUP 2: DYNAMIC PARKING FEE CALCULATOR
// -----------------------------------------------------------------------------
test('Parking Fee Service: Under grace period (<=15 min) returns 0 fee', () => {
  const now = new Date();
  const checkIn = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

  const result = ParkingFeeService.calculateFee({
    checkInTime: checkIn.toISOString(),
    checkOutTime: now.toISOString(),
    vehicleType: 'CAR',
    tenantId: TENANT_A_ID
  });

  assert.strictEqual(result.fee, 0, 'Grace period fee should be 0');
  assert.strictEqual(result.isGracePeriod, true);
});

test('Parking Fee Service: Car đỗ 1h30m (<2h base) charging base fee 25,000 VNĐ', () => {
  const now = new Date();
  const checkIn = new Date(now.getTime() - 90 * 60 * 1000); // 90 minutes ago

  const result = ParkingFeeService.calculateFee({
    checkInTime: checkIn.toISOString(),
    checkOutTime: now.toISOString(),
    vehicleType: 'CAR',
    tenantId: TENANT_A_ID
  });

  assert.strictEqual(result.fee, 25000, 'Base fee for 2 hours should be 25,000');
});

test('Parking Fee Service: Car đỗ 4h30m charging tiered fee (0-2h: 25k, 2-6h: 3h x 15k = 45k) = 70,000 VNĐ', () => {
  const now = new Date();
  const checkIn = new Date(now.getTime() - (4 * 60 + 30) * 60 * 1000); // 4.5 hours ago

  const result = ParkingFeeService.calculateFee({
    checkInTime: checkIn.toISOString(),
    checkOutTime: now.toISOString(),
    vehicleType: 'CAR',
    tenantId: TENANT_A_ID
  });

  assert.strictEqual(result.fee, 70000, 'Tiered fee should be 70,000 VNĐ');
});

// -----------------------------------------------------------------------------
// TEST GROUP 3: PAYMENT & IDEMPOTENT SEPAY WEBHOOK PROCESSING
// -----------------------------------------------------------------------------
test('Payment Service: Renewal order creation & voucher application', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_A_ID && v.vehicleType === 'CAR');

  const { paymentOrder, renewalOrder, paymentConfig } = PaymentService.createRenewalOrder({
    tenantId: TENANT_A_ID,
    vehicleId: vehicle.id,
    durationMonths: 1,
    voucherCode: 'HE2024' // 10% discount
  });

  assert.strictEqual(paymentOrder.status, 'WAITING_PAYMENT');
  assert.strictEqual(renewalOrder.original_amount, 1250000);
  assert.strictEqual(renewalOrder.discount_amount, 125000);
  assert.strictEqual(renewalOrder.final_amount, 1125000);
  assert.ok(paymentConfig.qrUrl.includes('1125000'), 'VietQR URL should contain final amount');
});

test('Payment Webhook Idempotency: Duplicate SePay webhooks processed exactly ONCE', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_A_ID);
  const { paymentOrder } = PaymentService.createRenewalOrder({
    tenantId: TENANT_A_ID,
    vehicleId: vehicle.id,
    durationMonths: 1
  });

  const gatewayTxId = `SEPAY-TX-${Date.now()}`;

  // First Webhook Delivery
  const res1 = PaymentService.processSePayWebhook({
    tenantId: TENANT_A_ID,
    transactionId: gatewayTxId,
    transferContent: `Thanh toan don hang ${paymentOrder.order_code}`,
    amount: paymentOrder.expected_amount,
    gateway: 'SEPAY'
  });

  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.matched, true);
  assert.strictEqual(paymentOrder.status, 'PAID');

  // Second Webhook Delivery (Duplicate re-transmission)
  const res2 = PaymentService.processSePayWebhook({
    tenantId: TENANT_A_ID,
    transactionId: gatewayTxId,
    transferContent: `Thanh toan don hang ${paymentOrder.order_code}`,
    amount: paymentOrder.expected_amount,
    gateway: 'SEPAY'
  });

  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.alreadyProcessed, true, 'Second call must be flagged alreadyProcessed = true');
});

console.log(`=======================================================`);
console.log(`  TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`=======================================================`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
