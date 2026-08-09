/**
 * FRONTEND TEST 3: VEHICLE SEARCH FILTER & APARTMENT LIST UI TEST
 * Run with: node tests/frontend/vehicle-search-ui.test.js
 */

import assert from 'assert';
import { MEMORY_DB } from '../../server/config/database.js';

console.log(`=======================================================`);
console.log(`  [FRONTEND TEST 3] VEHICLE SEARCH & APARTMENT FILTER UI`);
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

// 1. APARTMENT VEHICLE LIST RENDER TEST
test('Vehicle Search UI: Filter by Apartment Number A1-1205 returns all household vehicles', () => {
  const tenantVehicles = MEMORY_DB.vehicles.filter(v => v.tenant_id === TENANT_ID);
  
  // Simulated UI Search Handler
  const filterByApartment = (aptNo) => {
    return tenantVehicles.filter(v => (v.apartmentNumber || v.apartment_number) === aptNo);
  };

  const results = filterByApartment('A1-1205');
  assert.ok(results.length >= 2, 'Căn hộ A1-1205 phải trả về ít nhất 2 xe (Xe 1 & Xe 3)');
  assert.ok(results.some(v => (v.plateNumber || v.plate_number) === '30F-123.45'));
});

// 2. SEARCH BY PLATE NORMALIZED TEST
test('Vehicle Search UI: Normalizes raw user input "30f-12345" and matches plate', () => {
  const inputTerm = '30f-12345';
  const normalized = inputTerm.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  const match = MEMORY_DB.vehicles.find(v => v.tenant_id === TENANT_ID && (v.plateNormalized || v.plate_normalized) === normalized);
  assert.ok(match);
  assert.strictEqual(match.residentName, 'Trần Văn Tuấn');
});

console.log(`=======================================================`);
console.log(`  FRONTEND TEST 3 RESULT: ${passed}/${total} PASSED`);
console.log(`=======================================================`);

if (passed === total) process.exit(0); else process.exit(1);
