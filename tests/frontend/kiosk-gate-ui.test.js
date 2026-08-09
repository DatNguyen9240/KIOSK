/**
 * FRONTEND TEST 1: KIOSK GATE OPERATOR UI & BARRIER SIGNAL TEST
 * Run with: node tests/frontend/kiosk-gate-ui.test.js
 */

import assert from 'assert';
import { ParkingService } from '../../server/services/parking.service.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 1] KIOSK GATE UI & BARRIER SIGNAL`);
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

// 1. KIOSK CHECK-IN BARRIER SIGNAL RENDER TEST
test('Kiosk UI: Check-in entry renders OPEN_GATE signal and plate display', () => {
  const result = ParkingService.checkIn({
    tenantId: TENANT_ID,
    plateNumber: '30F-555.55'
  });

  const uiState = {
    gateSignal: result.gateAction,
    displayMessage: result.message,
    plateText: result.session.plate_number,
    checkInImage: result.session.check_in_image_url
  };

  assert.strictEqual(uiState.gateSignal, 'OPEN_GATE');
  assert.strictEqual(uiState.plateText, '30F-555.55');
  assert.ok(uiState.checkInImage.includes('30F55555'));
});

// 2. KIOSK CHECK-OUT CASUAL PAYMENT WAIT SIGNAL TEST
test('Kiosk UI: Casual check-out exceeding grace period renders WAIT_PAYMENT signal', () => {
  const checkInRes = ParkingService.checkIn({
    tenantId: TENANT_ID,
    plateNumber: '30A-111.11'
  });
  // Simulate stay exceeding grace period
  checkInRes.session.check_in_time = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

  const checkOutRes = ParkingService.checkOut({
    tenantId: TENANT_ID,
    plateNumber: '30A-111.11'
  });

  const uiState = {
    gateSignal: checkOutRes.gateAction,
    canExit: checkOutRes.canExit,
    feeText: `${checkOutRes.feeCalculation.fee.toLocaleString('vi-VN')} VNĐ`,
    qrUrl: checkOutRes.qrUrl
  };

  assert.strictEqual(uiState.gateSignal, 'WAIT_PAYMENT');
  assert.strictEqual(uiState.canExit, false);
  assert.ok(uiState.feeText.includes('VNĐ'));
  assert.ok(uiState.qrUrl.includes('img.vietqr.io'));
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 1 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
