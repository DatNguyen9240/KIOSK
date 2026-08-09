/**
 * FRONTEND TEST 6: EMERGENCY MOBILE GATE STATION UI TEST
 * Tests Mobile Station Fallback UI state, Manual Plate Entry & Manual Barrier Override Signal.
 * Run with: node tests/frontend/mobile-gate-station-ui.test.js
 */

import assert from 'assert';
import { ParkingService } from '../../server/services/parking.service.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 6] EMERGENCY MOBILE GATE STATION UI`);
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

// 1. MOBILE STATION MANUAL OVERRIDE UI TEST
test('Mobile Station UI: Emergency manual check-in returns OPEN_GATE barrier signal', () => {
  const result = ParkingService.checkIn({
    tenantId: TENANT_ID,
    plateNumber: '51H-999.99',
    imageUrl: '/mobile/camera_capture_51H99999.jpg'
  });

  const mobileStationState = {
    isMobileMode: true,
    manualPlateInput: '51H-999.99',
    capturedImage: result.session.check_in_image_url,
    barrierSignal: result.gateAction,
    operatorNote: 'Xác nhận qua trạm Mobile dự phòng'
  };

  assert.strictEqual(mobileStationState.isMobileMode, true);
  assert.strictEqual(mobileStationState.barrierSignal, 'OPEN_GATE');
  assert.ok(mobileStationState.capturedImage.includes('mobile'));
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 6 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
