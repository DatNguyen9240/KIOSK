/**
 * Debt & Revenue Reporting Service
 * Computes debt, revenue, and renewal metrics grouped by Towers (Tháp A1, Tháp A2...)
 * Optimized with O(1) Hash Map Indexing - 0% N+1 performance bottleneck.
 */

import { MEMORY_DB } from '../config/database.js';

export class ReportService {
  /**
   * Generates a debt and revenue report grouped by Tower for a specific tenant.
   * Uses O(1) Hash Map pre-indexing to guarantee linear execution time (NO N+1 loops).
   *
   * @param {string} tenantId - Tenant UUID
   * @returns {Object} { totalRevenue, totalOutstandingDebt, towerReports }
   */
  static getReportByTower(tenantId) {
    const tenantTowers = (MEMORY_DB.towers || []).filter(t => t.tenant_id === tenantId);
    const tenantApartments = (MEMORY_DB.apartments || []).filter(a => a.tenant_id === tenantId);
    const tenantVehicles = (MEMORY_DB.vehicles || []).filter(v => v.tenant_id === tenantId);
    const tenantRenewalOrders = (MEMORY_DB.renewal_orders || []).filter(r => r.tenant_id === tenantId);

    const now = new Date();

    // =========================================================================
    // STEP 1: PRE-INDEX DATA IN O(N) TO ELIMINATE N+1 NESTED LOOPS
    // =========================================================================

    // Map 1: tower_id -> Array of Apartments
    const apartmentsByTowerMap = new Map();
    // Map 2: apartment_id / room_number -> tower_id
    const roomToTowerMap = new Map();

    for (const apt of tenantApartments) {
      if (!apartmentsByTowerMap.has(apt.tower_id)) {
        apartmentsByTowerMap.set(apt.tower_id, []);
      }
      apartmentsByTowerMap.get(apt.tower_id).push(apt);
      roomToTowerMap.set(apt.id, apt.tower_id);
      if (apt.room_number) {
        roomToTowerMap.set(apt.room_number, apt.tower_id);
      }
    }

    // Map 3: vehicle_id -> Total Paid Revenue Amount
    const vehicleRevenueMap = new Map();
    for (const order of tenantRenewalOrders) {
      const currentRev = vehicleRevenueMap.get(order.vehicle_id) || 0;
      vehicleRevenueMap.set(order.vehicle_id, currentRev + Number(order.final_amount || 0));
    }

    // Map 4: tower_id -> Aggregated Stats Object
    const towerStatsMap = new Map();
    for (const tower of tenantTowers) {
      towerStatsMap.set(tower.id, {
        totalApartments: (apartmentsByTowerMap.get(tower.id) || []).length,
        totalVehicles: 0,
        activeVehiclesCount: 0,
        expiredVehiclesCount: 0,
        towerRevenue: 0,
        outstandingDebt: 0
      });
    }

    // =========================================================================
    // STEP 2: SINGLE-PASS AGGREGATION O(V) - NO N+1 LOOPING
    // =========================================================================
    for (const vehicle of tenantVehicles) {
      // Find matching tower in O(1)
      const towerId = roomToTowerMap.get(vehicle.apartment_id) || roomToTowerMap.get(vehicle.apartmentNumber || vehicle.apartment_number);
      if (!towerId || !towerStatsMap.has(towerId)) continue;

      const stats = towerStatsMap.get(towerId);
      stats.totalVehicles += 1;

      const expDate = new Date(vehicle.expireDate || vehicle.expiry_date || 0);
      const isExpired = expDate < now || vehicle.status === 'EXPIRED';

      if (isExpired) {
        stats.expiredVehiclesCount += 1;
        // Tariff estimate: CAR = 1.25M, MOTORBIKE = 120K
        const monthlyTariff = (vehicle.vehicleType || vehicle.vehicle_type) === 'CAR' ? 1250000 : 120000;
        stats.outstandingDebt += monthlyTariff;
      } else {
        stats.activeVehiclesCount += 1;
      }

      // Add revenue linked to vehicle in O(1)
      const vehicleRevenue = vehicleRevenueMap.get(vehicle.id) || 0;
      stats.towerRevenue += vehicleRevenue;
    }

    // =========================================================================
    // STEP 3: ASSEMBLE FINAL REPORT
    // =========================================================================
    let totalRevenue = 0;
    let totalOutstandingDebt = 0;

    const towerReports = tenantTowers.map(tower => {
      const stats = towerStatsMap.get(tower.id) || {
        totalApartments: 0,
        totalVehicles: 0,
        activeVehiclesCount: 0,
        expiredVehiclesCount: 0,
        towerRevenue: 0,
        outstandingDebt: 0
      };

      totalRevenue += stats.towerRevenue;
      totalOutstandingDebt += stats.outstandingDebt;

      return {
        towerId: tower.id,
        towerCode: tower.code,
        towerName: tower.name,
        totalApartments: stats.totalApartments,
        totalVehicles: stats.totalVehicles,
        activeVehiclesCount: stats.activeVehiclesCount,
        expiredVehiclesCount: stats.expiredVehiclesCount,
        towerRevenue: stats.towerRevenue,
        outstandingDebt: stats.outstandingDebt
      };
    });

    return {
      tenantId,
      totalRevenue,
      totalOutstandingDebt,
      towerReports
    };
  }
}
