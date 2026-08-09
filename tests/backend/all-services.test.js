/**
 * BACKEND TEST 2: ALL 6 SERVICES DOMAIN TEST
 * Run with: node tests/backend/all-services.test.js
 */

import assert from 'assert';
import { AuditService } from '../../server/services/audit.service.js';
import { ParkingFeeService } from '../../server/services/fee-calculator.service.js';
import { ParkingService } from '../../server/services/parking.service.js';
import { PaymentService } from '../../server/services/payment.service.js';
import { EmailService } from '../../server/services/email.service.js';
import { ReportService } from '../../server/services/report.service.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [BACKEND TEST 2] ALL 6 CORE DOMAIN SERVICES`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] Service Test: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] Service Test: ${name}`);
    console.error(`         ${err.message}`);
  }
}

// 1. AUDIT SERVICE
test('AuditService - Log and retrieve audit events', () => {
  const initialCount = AuditService.getLogs(TENANT_ID).length;
  AuditService.log({ tenantId: TENANT_ID, userId: 'user-01', action: 'TEST_ACT', entityType: 'VEHICLE', entityId: 'v-1' });
  assert.strictEqual(AuditService.getLogs(TENANT_ID).length, initialCount + 1);
});

// 2. FEE CALCULATOR
test('ParkingFeeService - Tiered rate calculation', () => {
  const feeRes = ParkingFeeService.calculateFee({
    checkInTime: '2026-08-09T08:00:00Z',
    checkOutTime: '2026-08-09T12:30:00Z',
    vehicleType: 'CAR',
    tenantId: TENANT_ID
  });
  assert.strictEqual(feeRes.fee, 70000);
});

// 3. PARKING SERVICE
test('ParkingService - Kiosk Check-in & Check-out flow', () => {
  const checkInRes = ParkingService.checkIn({ tenantId: TENANT_ID, plateNumber: '30F-111.22' });
  assert.strictEqual(checkInRes.success, true);

  checkInRes.session.check_in_time = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const checkOutRes = ParkingService.checkOut({ tenantId: TENANT_ID, plateNumber: '30F-111.22' });
  assert.strictEqual(checkOutRes.success, true);
  assert.ok(checkOutRes.paymentOrder);
});

// 4. PAYMENT SERVICE
test('PaymentService - Renewal order & SePay Auto-Match', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID);
  const orderRes = PaymentService.createRenewalOrder({ tenantId: TENANT_ID, vehicleId: vehicle.id, durationMonths: 1 });
  
  const matchRes = PaymentService.processSePayWebhook({
    tenantId: TENANT_ID,
    transactionId: `BE-TX-${Date.now()}`,
    transferContent: orderRes.paymentOrder.order_code,
    amount: orderRes.paymentOrder.expected_amount
  });
  assert.strictEqual(matchRes.matched, true);
  assert.strictEqual(orderRes.paymentOrder.status, 'PAID');
});

// 5. EMAIL SERVICE
test('EmailService - Automated expiry reminders', () => {
  const emailRes = EmailService.scanAndSendExpiryReminders({ tenantId: TENANT_ID, daysThreshold: 30 });
  assert.strictEqual(emailRes.success, true);
});

// 6. REPORT SERVICE
test('ReportService - Tower debt & revenue aggregation O(1)', () => {
  const reportRes = ReportService.getReportByTower(TENANT_ID);
  assert.strictEqual(reportRes.tenantId, TENANT_ID);
  assert.ok(Array.isArray(reportRes.towerReports));
});

console.log(`=======================================================`);
console.log(`  BACKEND TEST 2 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
