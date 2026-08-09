/**
 * BACKEND TEST 4: EDGE CASES & ERROR HANDLING TEST
 * Run with: node tests/backend/edge-cases.test.js
 */

import assert from 'assert';
import { ParkingFeeService } from '../../server/services/fee-calculator.service.js';
import { ParkingService } from '../../server/services/parking.service.js';
import { PaymentService } from '../../server/services/payment.service.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [BACKEND TEST 4] EDGE CASES & ERROR INPUT VALIDATION`);
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

// 1. EMPTY PLATE CHECK-IN
test('Edge Case: Check-in with empty license plate throws exception', () => {
  assert.throws(() => {
    ParkingService.checkIn({ tenantId: TENANT_ID, plateNumber: '' });
  }, /không được để trống/i);
});

// 2. CHECK-OUT NON-EXISTENT SESSION
test('Edge Case: Check-out non-existent parking session throws exception', () => {
  assert.throws(() => {
    ParkingService.checkOut({ tenantId: TENANT_ID, plateNumber: 'UNKNOWN-PLATE-99' });
  }, /Không tìm thấy phiên gửi xe/i);
});

// 3. UNDERPAID BANK TRANSFER REJECTION
test('Edge Case: SePay transfer with insufficient amount flags underpaid status', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID);
  const { paymentOrder } = PaymentService.createRenewalOrder({ tenantId: TENANT_ID, vehicleId: vehicle.id, durationMonths: 1 });

  const underpaidRes = PaymentService.processSePayWebhook({
    tenantId: TENANT_ID,
    transactionId: `TX-UNDER-${Date.now()}`,
    transferContent: paymentOrder.order_code,
    amount: paymentOrder.expected_amount - 50000,
    gateway: 'SEPAY'
  });

  assert.strictEqual(underpaidRes.success, false);
  assert.strictEqual(underpaidRes.underpaid, true);
  assert.strictEqual(paymentOrder.status, 'WAITING_PAYMENT');
});

// 4. INVALID VOUCHER DISCOUNT MINIMUM AMOUNT
test('Edge Case: Applying voucher on order below minimum requirement throws exception', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID && v.vehicleType === 'MOTORBIKE');
  assert.throws(() => {
    PaymentService.createRenewalOrder({
      tenantId: TENANT_ID,
      vehicleId: vehicle.id,
      durationMonths: 1,
      voucherCode: 'TRIAN100K'
    });
  }, /minimum requirement|tối thiểu/i);
});

// 5. UNCONFIGURED TARIFF EXCEPTION
test('Edge Case: Calculating fee for unconfigured vehicle type throws exception', () => {
  assert.throws(() => {
    ParkingFeeService.calculateFee({
      checkInTime: new Date().toISOString(),
      vehicleType: 'UNCONFIGURED_TRUCK_TYPE',
      tenantId: TENANT_ID
    });
  }, /Chưa cấu hình bảng giá/i);
});

console.log(`=======================================================`);
console.log(`  BACKEND TEST 4 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
