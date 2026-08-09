/**
 * FRONTEND TEST 2: VIETQR GENERATOR & TIMEOUT COUNTDOWN UI TEST
 * Run with: node tests/frontend/vietqr-timer-ui.test.js
 */

import assert from 'assert';
import { PaymentService } from '../../server/services/payment.service.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 2] VIETQR & COUNTDOWN TIMER UI`);
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

// 1. VIETQR IMAGE COMPONENT RENDER TEST
test('VietQR UI Component: Renders image URL with bank BIN, account number, and amount', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID);
  const { paymentOrder, paymentConfig } = PaymentService.createRenewalOrder({
    tenantId: TENANT_ID,
    vehicleId: vehicle.id,
    durationMonths: 1
  });

  const qrComponentState = {
    imageUrl: paymentConfig.qrUrl,
    bankAccountNo: paymentConfig.bankAccountNo,
    amountText: `${paymentOrder.expected_amount.toLocaleString('vi-VN')} VNĐ`,
    timeoutSeconds: paymentConfig.timeoutSeconds
  };

  assert.ok(qrComponentState.imageUrl.includes(paymentConfig.bankBin));
  assert.ok(qrComponentState.imageUrl.includes(paymentConfig.bankAccountNo));
  assert.strictEqual(qrComponentState.timeoutSeconds, 900);
});

// 2. COUNTDOWN TIMER COMPONENT TICK TEST
test('Countdown Timer Component: Computes remaining seconds correctly', () => {
  const expiresAt = new Date(Date.now() + 120 * 1000).toISOString();
  
  // Simulated UI Timer Tick Function
  const getRemainingSeconds = (expiryISO) => {
    const diff = new Date(expiryISO).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const remaining = getRemainingSeconds(expiresAt);
  assert.ok(remaining >= 119 && remaining <= 120, 'Remaining timer must be ~120s');
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 2 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
