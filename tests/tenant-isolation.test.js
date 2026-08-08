/**
 * PARKING.GO KIOSK — MULTI-TENANT ISOLATION & SECURITY TEST SUITE
 * Run with: node tests/tenant-isolation.test.js
 */

import assert from 'assert';
import { resolveTenantContext } from '../server/middleware/tenant-context.js';
import { requirePermission } from '../server/middleware/rbac.js';
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

test('Parking Fee Service: Car đỗ 4h30m charging base fee (25k) + 3h extra (30k) = 55,000 VNĐ', () => {
  const now = new Date();
  const checkIn = new Date(now.getTime() - (4 * 60 + 30) * 60 * 1000); // 4.5 hours ago

  const result = ParkingFeeService.calculateFee({
    checkInTime: checkIn.toISOString(),
    checkOutTime: now.toISOString(),
    vehicleType: 'CAR',
    tenantId: TENANT_A_ID
  });

  // Total 5 hours rounded up = 2 base hours (25k) + 3 extra hours (3 * 10k) = 55,000
  assert.strictEqual(result.fee, 55000, 'Total fee should be 55,000 VNĐ');
});

// -----------------------------------------------------------------------------
// TEST GROUP 3: PAYMENT & IDEMPOTENT WEBHOOK PROCESSING
// -----------------------------------------------------------------------------
test('Payment Service: Renewal order creation & voucher application', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_A_ID && v.vehicleType === 'CAR');

  const { order, paymentConfig } = PaymentService.createRenewalOrder({
    tenantId: TENANT_A_ID,
    vehicleId: vehicle.id,
    durationMonths: 1,
    voucherCode: 'HE2024' // 10% discount
  });

  assert.strictEqual(order.status, 'WAITING_PAYMENT');
  assert.strictEqual(order.original_amount, 1250000);
  assert.strictEqual(order.discount_amount, 125000);
  assert.strictEqual(order.final_amount, 1125000);
  assert.ok(paymentConfig.qrUrl.includes('1125000'), 'VietQR URL should contain final amount');
});

test('Payment Webhook Idempotency: Duplicate webhook calls processed exactly ONCE', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_A_ID);
  const { order } = PaymentService.createRenewalOrder({
    tenantId: TENANT_A_ID,
    vehicleId: vehicle.id,
    durationMonths: 1
  });

  const gatewayTxId = `GTX-${Date.now()}`;

  // First Webhook Delivery
  const res1 = PaymentService.processPaymentWebhook({
    tenantId: TENANT_A_ID,
    gatewayTransactionId: gatewayTxId,
    orderCode: order.order_code,
    amount: order.final_amount
  });

  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.alreadyProcessed, false);
  assert.strictEqual(order.status, 'PAID');

  // Second Webhook Delivery (Duplicate re-transmission)
  const res2 = PaymentService.processPaymentWebhook({
    tenantId: TENANT_A_ID,
    gatewayTransactionId: gatewayTxId,
    orderCode: order.order_code,
    amount: order.final_amount
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
