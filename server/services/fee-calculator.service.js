/**
 * Dynamic Parking Fee Calculation Engine Service
 * Implements tiered rate calculation from tenant tariff_rules & tariff_tiers.
 * Zero hardcoded fallback fees - strictly loads configuration from Database.
 */

import { MEMORY_DB } from '../config/database.js';

export class ParkingFeeService {
  /**
   * Calculates parking fee for a given parking duration and vehicle type within a specific Tenant context.
   *
   * @param {Object} params
   * @param {string} params.checkInTime - ISO timestamp of vehicle entry
   * @param {string} [params.checkOutTime] - ISO timestamp of vehicle exit (defaults to NOW)
   * @param {string} params.vehicleType - 'CAR', 'MOTORBIKE', 'ELECTRIC_BIKE'
   * @param {string} params.tenantId - Tenant UUID
   * @param {boolean} [params.isMonthlySubscriber=false] - Whether vehicle is a monthly subscriber
   * @returns {Object} { durationMinutes, fee, feeBreakdown, isGracePeriod }
   */
  static calculateFee({ checkInTime, checkOutTime, vehicleType, tenantId, isMonthlySubscriber = false }) {
    const durationMinutes = this.getDurationMinutes(checkInTime, checkOutTime);

    // 1. Monthly subscribers park for free
    if (isMonthlySubscriber) {
      return {
        durationMinutes,
        fee: 0,
        feeBreakdown: 'Gói vé tháng (Miễn phí lượt gửi)',
        isGracePeriod: false
      };
    }

    // 2. Load active Tariff rule for tenant and vehicle type
    const tenantTariffs = (MEMORY_DB.tariff_rules || []).filter(
      t => t.tenant_id === tenantId && t.is_active !== false
    );

    const rule = tenantTariffs.find(
      t => t.vehicle_type === vehicleType && t.tariff_type === 'CASUAL'
    );

    if (!rule) {
      throw new Error(`Tenant chưa cấu hình bảng giá vé lượt (CASUAL) cho loại xe [${vehicleType}].`);
    }

    // 3. Check Grace Period
    const graceMinutes = rule.grace_period_minutes || 0;
    if (durationMinutes <= graceMinutes) {
      return {
        durationMinutes,
        fee: 0,
        feeBreakdown: `Thời gian đỗ xe (${durationMinutes} phút) <= ${graceMinutes} phút (Miễn phí gia ân)`,
        isGracePeriod: true
      };
    }

    const totalHours = Math.ceil(durationMinutes / 60);

    // 4. Load Multi-Tier Rules from Database
    const tiers = (MEMORY_DB.tariff_tiers || [])
      .filter(tier => tier.tariff_rule_id === rule.id || (tier.tenant_id === tenantId && tier.tariff_rule_id === rule.id))
      .sort((a, b) => a.tier_order - b.tier_order);

    if (tiers.length === 0) {
      throw new Error(`Tenant chưa cấu hình các khung giờ lũy tiến (tariff_tiers) cho quy tắc [${rule.id}].`);
    }

    // 5. Calculate Tiered Fee Range
    let totalFee = 0;
    const breakdownParts = [];

    for (const tier of tiers) {
      if (totalHours <= tier.from_hours) continue;

      const tierToHours = tier.to_hours ?? Infinity;
      const applicableHours = Math.min(totalHours, tierToHours) - tier.from_hours;

      if (applicableHours > 0) {
        if (tier.is_extra_hourly) {
          const tierCost = applicableHours * Number(tier.tier_fee);
          totalFee += tierCost;
          const rangeLabel = tier.to_hours ? `${tier.from_hours}-${tier.to_hours}h` : `>${tier.from_hours}h`;
          breakdownParts.push(`Khung ${rangeLabel}: ${applicableHours}h x ${Number(tier.tier_fee).toLocaleString('vi-VN')}đ = ${tierCost.toLocaleString('vi-VN')}đ`);
        } else {
          const tierCost = Number(tier.tier_fee);
          totalFee += tierCost;
          breakdownParts.push(`Block ${tier.from_hours}-${tier.to_hours}h: ${tierCost.toLocaleString('vi-VN')}đ`);
        }
      }
    }

    return {
      durationMinutes,
      fee: totalFee,
      feeBreakdown: breakdownParts.join(' | '),
      isGracePeriod: false
    };
  }

  /**
   * Helper function to calculate duration in minutes between check-in and check-out.
   */
  static getDurationMinutes(checkInTime, checkOutTime) {
    const checkIn = new Date(checkInTime);
    const checkOut = checkOutTime ? new Date(checkOutTime) : new Date();
    return Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)));
  }
}
