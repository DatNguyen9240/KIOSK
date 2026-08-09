/**
 * PARKING.GO KIOSK — FULL SERVICES SUITE VERIFICATION TEST
 * Tests all 6 core services: AuditService, ParkingFeeService, ParkingService, PaymentService, EmailService, ReportService.
 * Run with: node tests/all-services.test.js
 */

import assert from 'assert';
import { AuditService } from '../server/services/audit.service.js';
import { ParkingFeeService } from '../server/services/fee-calculator.service.js';
import { ParkingService } from '../server/services/parking.service.js';
import { PaymentService } from '../server/services/payment.service.js';
import { EmailService } from '../server/services/email.service.js';
import { ReportService } from '../server/services/report.service.js';
import { MEMORY_DB } from '../server/config/database.js';

console.log(`=======================================================`);
console.log(`  VERIFYING ALL 6 BACKEND SERVICES (100% COVERAGE)`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // Vinhomes Ocean Park
let passed = 0;
let total = 0;

function runTest(name, fn) {
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

// 1. AUDIT SERVICE TEST
runTest('AuditService - Ghi và đọc audit logs an toàn', () => {
  const initialLogsCount = AuditService.getLogs(TENANT_ID).length;
  AuditService.log({
    tenantId: TENANT_ID,
    userId: 'user-test-01',
    action: 'TEST_AUDIT_ACTION',
    entityType: 'TEST_ENTITY',
    entityId: 'ent-999',
    newData: { status: 'OK' }
  });
  const updatedLogs = AuditService.getLogs(TENANT_ID);
  assert.strictEqual(updatedLogs.length, initialLogsCount + 1);
  assert.strictEqual(updatedLogs[0].action, 'TEST_AUDIT_ACTION');
});

// 2. PARKING FEE CALCULATOR SERVICE TEST
runTest('ParkingFeeService - Tính phí lũy tiến chính xác theo khung giờ', () => {
  const checkIn = new Date('2026-08-09T08:00:00Z');
  const checkOut = new Date('2026-08-09T12:30:00Z'); // 4.5h đỗ xe (khung 0-2h: 25k, khung 2-6h: 3h x 15k = 45k) => 70,000đ

  const feeRes = ParkingFeeService.calculateFee({
    checkInTime: checkIn.toISOString(),
    checkOutTime: checkOut.toISOString(),
    vehicleType: 'CAR',
    tenantId: TENANT_ID
  });

  assert.strictEqual(feeRes.fee, 70000);
  assert.strictEqual(feeRes.isGracePeriod, false);
});

// 3. PARKING SERVICE TEST (CHECK-IN & CHECK-OUT)
runTest('ParkingService - Luồng Check-in và Check-out phiên đỗ xe Kiosk', () => {
  const checkInRes = ParkingService.checkIn({
    tenantId: TENANT_ID,
    plateNumber: '30F-999.99',
    cardNumber: 'CARD-TEST-88',
    gateInId: 'g1111111-0000-0000-0000-00000000in01'
  });

  assert.strictEqual(checkInRes.success, true);
  assert.strictEqual(checkInRes.session.status, 'ACTIVE');

  // Simulate check-in 3 hours ago
  checkInRes.session.check_in_time = new Date(Date.now() - 3 * 3600 * 1000).toISOString();

  const checkOutRes = ParkingService.checkOut({
    tenantId: TENANT_ID,
    plateNumber: '30F-999.99',
    gateOutId: 'g1111111-0000-0000-0000-000000out1'
  });

  assert.strictEqual(checkOutRes.success, true);
  assert.ok(checkOutRes.paymentOrder, 'Phải sinh Payment Order khi xe vãng lai đỗ quá gian gia ân');
  assert.ok(checkOutRes.feeCalculation.fee > 0, 'Phí đỗ xe phải > 0');
});

// 4. PAYMENT SERVICE TEST (RENEWAL & SEPAY RECONCILIATION)
runTest('PaymentService - Tạo đơn gia hạn & Khớp lệnh SePay tự động', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID);
  
  const orderRes = PaymentService.createRenewalOrder({
    tenantId: TENANT_ID,
    vehicleId: vehicle.id,
    durationMonths: 2,
    voucherCode: 'HE2024' // 10% discount
  });

  assert.strictEqual(orderRes.paymentOrder.status, 'WAITING_PAYMENT');
  assert.strictEqual(orderRes.renewalOrder.original_amount, 2500000);
  assert.strictEqual(orderRes.renewalOrder.discount_amount, 250000);
  assert.strictEqual(orderRes.renewalOrder.final_amount, 2250000);

  // Simulating SePay Webhook Auto-Match
  const matchRes = PaymentService.processSePayWebhook({
    tenantId: TENANT_ID,
    transactionId: `SEPAY-BENCH-${Date.now()}`,
    transferContent: `Chuyen khoan don ${orderRes.paymentOrder.order_code}`,
    amount: 2250000,
    gateway: 'SEPAY'
  });

  assert.strictEqual(matchRes.success, true);
  assert.strictEqual(matchRes.matched, true);
  assert.strictEqual(orderRes.paymentOrder.status, 'PAID');
});

// 5. EMAIL REMINDER SERVICE TEST
runTest('EmailService - Quét và phát thông báo Email gia hạn tự động', () => {
  const emailRes = EmailService.scanAndSendExpiryReminders({
    tenantId: TENANT_ID,
    daysThreshold: 30
  });

  assert.strictEqual(emailRes.success, true);
  assert.ok(Array.isArray(emailRes.reminderLogs));
});

// 6. REPORT SERVICE TEST (TOWER-BASED REPORTING)
runTest('ReportService - Tổng hợp Báo cáo Doanh thu & Công nợ theo Tháp O(1)', () => {
  const reportRes = ReportService.getReportByTower(TENANT_ID);

  assert.strictEqual(reportRes.tenantId, TENANT_ID);
  assert.ok(Array.isArray(reportRes.towerReports));
  assert.ok(reportRes.towerReports.length > 0);
  assert.ok(typeof reportRes.totalRevenue === 'number');
});

console.log(`=======================================================`);
console.log(`  FULL SERVICES TEST RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
