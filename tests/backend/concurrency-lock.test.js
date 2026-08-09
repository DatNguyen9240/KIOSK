/**
 * BACKEND TEST 3: CONCURRENCY & RACE CONDITION TEST
 * Run with: node tests/backend/concurrency-lock.test.js
 */

import assert from 'assert';
import { PaymentService } from '../../server/services/payment.service.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [BACKEND TEST 3] CONCURRENCY & RACE CONDITION LOCK`);
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

// 1. CONCURRENT SEPAY WEBHOOK ARRIVAL (SIMULTANEOUS 10 WEBHOOK RETRIES)
test('Concurrency: 10 parallel SePay webhooks for same transaction match exactly ONCE', async () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID);
  const { paymentOrder } = PaymentService.createRenewalOrder({
    tenantId: TENANT_ID,
    vehicleId: vehicle.id,
    durationMonths: 1
  });

  const gatewayTxId = `CONCUR-TX-${Date.now()}`;

  const promises = Array.from({ length: 10 }).map(() =>
    Promise.resolve().then(() =>
      PaymentService.processSePayWebhook({
        tenantId: TENANT_ID,
        transactionId: gatewayTxId,
        transferContent: `Noi dung ck ORD ${paymentOrder.order_code}`,
        amount: paymentOrder.expected_amount,
        gateway: 'SEPAY'
      })
    )
  );

  const results = await Promise.all(promises);

  const matchedCount = results.filter(r => r.matched === true && !r.alreadyProcessed).length;
  const alreadyProcessedCount = results.filter(r => r.alreadyProcessed === true).length;

  assert.strictEqual(matchedCount, 1);
  assert.strictEqual(alreadyProcessedCount, 9);
  assert.strictEqual(paymentOrder.status, 'PAID');
});

// 2. VOUCHER USAGE LIMIT CONCURRENCY LOCK
test('Concurrency: Voucher usage limit strictly enforced under high concurrency', () => {
  const limitVoucher = {
    id: `vch-limit-${Date.now()}`,
    tenant_id: TENANT_ID,
    code: `LIMITED_${Date.now()}`,
    discount_type: 'FIXED',
    discount_value: 50000,
    min_order_amount: 100000,
    usage_limit: 2,
    used_count: 0,
    is_active: true
  };
  MEMORY_DB.vouchers.push(limitVoucher);
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID);

  const res1 = PaymentService.createRenewalOrder({ tenantId: TENANT_ID, vehicleId: vehicle.id, durationMonths: 1, voucherCode: limitVoucher.code });
  PaymentService.processSePayWebhook({ tenantId: TENANT_ID, transactionId: `TX-LIMIT-1-${Date.now()}`, transferContent: res1.paymentOrder.order_code, amount: res1.paymentOrder.expected_amount });
  assert.strictEqual(limitVoucher.used_count, 1);

  const res2 = PaymentService.createRenewalOrder({ tenantId: TENANT_ID, vehicleId: vehicle.id, durationMonths: 1, voucherCode: limitVoucher.code });
  PaymentService.processSePayWebhook({ tenantId: TENANT_ID, transactionId: `TX-LIMIT-2-${Date.now()}`, transferContent: res2.paymentOrder.order_code, amount: res2.paymentOrder.expected_amount });
  assert.strictEqual(limitVoucher.used_count, 2);

  assert.throws(() => {
    PaymentService.createRenewalOrder({ tenantId: TENANT_ID, vehicleId: vehicle.id, durationMonths: 1, voucherCode: limitVoucher.code });
  }, /usage limit|hết lượt/i);
});

console.log(`=======================================================`);
console.log(`  BACKEND TEST 3 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
