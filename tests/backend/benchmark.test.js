/**
 * BACKEND TEST 6: STRESS & BENCHMARK PERFORMANCE SUITE
 * Measures throughput (ops/sec) and latency for Fee Calculation & Report Aggregation.
 * Run with: node tests/backend/benchmark.test.js
 */

import assert from 'assert';
import { ParkingFeeService } from '../../server/services/fee-calculator.service.js';
import { ReportService } from '../../server/services/report.service.js';

console.log(`=======================================================`);
console.log(`  [BACKEND TEST 6] PERFORMANCE & STRESS BENCHMARK`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const ITERATIONS = 10000;

console.log(`[Benchmark 1] Fee Calculation Engine (${ITERATIONS.toLocaleString()} ops)...`);
const feeStart = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  ParkingFeeService.calculateFee({
    checkInTime: '2026-08-09T08:00:00Z',
    checkOutTime: '2026-08-09T14:45:00Z',
    vehicleType: 'CAR',
    tenantId: TENANT_ID
  });
}

const feeDurationMs = performance.now() - feeStart;
const feeOpsPerSec = Math.round((ITERATIONS / feeDurationMs) * 1000);

console.log(`  -> Throughput: ${feeOpsPerSec.toLocaleString()} ops/sec (Latency: ${(feeDurationMs / ITERATIONS).toFixed(4)} ms)`);
assert.ok(feeOpsPerSec > 1000);

console.log(`\n[Benchmark 2] O(1) Tower Report Aggregator (${ITERATIONS.toLocaleString()} ops)...`);
const reportStart = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  ReportService.getReportByTower(TENANT_ID);
}

const reportDurationMs = performance.now() - reportStart;
const reportOpsPerSec = Math.round((ITERATIONS / reportDurationMs) * 1000);

console.log(`  -> Throughput: ${reportOpsPerSec.toLocaleString()} ops/sec (Latency: ${(reportDurationMs / ITERATIONS).toFixed(4)} ms)`);
assert.ok(reportOpsPerSec > 1000);

console.log(`\n=======================================================`);
console.log(`  BACKEND TEST 6 RESULT: BENCHMARK PASSED`);
console.log(`=======================================================`);
