/**
 * PARKING.GO KIOSK — STRESS & BENCHMARK PERFORMANCE SUITE
 * Measures throughput (ops/sec) and latency for Fee Calculation & Report Aggregations over 10,000 iterations.
 * Run with: node tests/benchmark.test.js
 */

import assert from 'assert';
import { ParkingFeeService } from '../server/services/fee-calculator.service.js';
import { ReportService } from '../server/services/report.service.js';

console.log(`=======================================================`);
console.log(`  RUNNING PERFORMANCE & LATENCY BENCHMARK SUITE`);
console.log(`=======================================================`);

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const ITERATIONS = 10000;

// 1. BENCHMARK PARKING FEE CALCULATOR ENGINE
console.log(`[Benchmark 1] Fee Calculation Engine (${ITERATIONS.toLocaleString()} iterations)...`);
const feeStart = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  ParkingFeeService.calculateFee({
    checkInTime: '2026-08-09T08:00:00Z',
    checkOutTime: '2026-08-09T14:45:00Z',
    vehicleType: 'CAR',
    tenantId: TENANT_ID
  });
}

const feeEnd = performance.now();
const feeDurationMs = feeEnd - feeStart;
const feeOpsPerSec = Math.round((ITERATIONS / feeDurationMs) * 1000);

console.log(`  -> Execution Time : ${feeDurationMs.toFixed(2)} ms`);
console.log(`  -> Latency per Op : ${(feeDurationMs / ITERATIONS).toFixed(4)} ms`);
console.log(`  -> Throughput     : ${feeOpsPerSec.toLocaleString()} ops/sec`);

assert.ok(feeOpsPerSec > 10000, 'Fee Calculation ops/sec must be > 10,000');

// 2. BENCHMARK O(1) TOWER REPORT AGGREGATOR ENGINE
console.log(`\n[Benchmark 2] O(1) Tower Report Aggregator (${ITERATIONS.toLocaleString()} iterations)...`);
const reportStart = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  ReportService.getReportByTower(TENANT_ID);
}

const reportEnd = performance.now();
const reportDurationMs = reportEnd - reportStart;
const reportOpsPerSec = Math.round((ITERATIONS / reportDurationMs) * 1000);

console.log(`  -> Execution Time : ${reportDurationMs.toFixed(2)} ms`);
console.log(`  -> Latency per Op : ${(reportDurationMs / ITERATIONS).toFixed(4)} ms`);
console.log(`  -> Throughput     : ${reportOpsPerSec.toLocaleString()} ops/sec`);

assert.ok(reportOpsPerSec > 5000, 'Report Aggregation ops/sec must be > 5,000');

console.log(`\n=======================================================`);
console.log(`  BENCHMARK COMPLETED: ALL PERFORMANCE TARGETS PASSED`);
console.log(`=======================================================`);
