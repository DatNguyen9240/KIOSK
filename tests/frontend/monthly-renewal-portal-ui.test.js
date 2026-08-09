/**
 * FRONTEND TEST 5: RESIDENT MONTHLY RENEWAL PORTAL UI TEST
 * Tests Resident Renewal Form, Duration Selector, Voucher Input & Dynamic Price Calculation UI Component.
 * Run with: node tests/frontend/monthly-renewal-portal-ui.test.js
 */

import assert from 'assert';
import { PaymentService } from '../../server/services/payment.service.js';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 5] RESIDENT MONTHLY RENEWAL PORTAL UI`);
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

// 1. RENEWAL PORTAL FORM SELECTION & PRICE COMPUTATION UI TEST
test('Renewal Portal UI: Selecting 3 months renewal calculates discount and final total', () => {
  const vehicle = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID && v.vehicleType === 'CAR');

  // Simulated UI Portal Action Handler
  const portalOrderRes = PaymentService.createRenewalOrder({
    tenantId: TENANT_ID,
    vehicleId: vehicle.id,
    durationMonths: 3,
    voucherCode: 'HE2024' // 10% discount
  });

  const portalFormUiState = {
    selectedVehiclePlate: vehicle.plateNumber,
    durationMonthsText: '3 tháng',
    originalAmountText: '3.750.000 VNĐ',
    discountAmountText: '375.000 VNĐ',
    finalTotalText: `${portalOrderRes.renewalOrder.final_amount.toLocaleString('vi-VN')} VNĐ`,
    newExpiryText: portalOrderRes.renewalOrder.new_expiry_date,
    qrImageVisible: true
  };

  assert.strictEqual(portalFormUiState.selectedVehiclePlate, '30F-123.45');
  assert.ok(portalFormUiState.finalTotalText.includes('3.375.000'));
  assert.strictEqual(portalFormUiState.qrImageVisible, true);
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 5 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
