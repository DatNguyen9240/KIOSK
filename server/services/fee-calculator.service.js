/**
 * Parking Fee Calculation Engine Service
 * Implements section 20 of Master Plan: Dynamic rate calculation, grace periods, base rates & extra hourly fees.
 */

import { MEMORY_DB } from '../config/database.js';

export class ParkingFeeService {
  /**
   * Calculates parking fee for a given parking duration and vehicle type within a specific Tenant context.
   */
  static calculateFee({ checkInTime, checkOutTime, vehicleType, tenantId, isMonthlySubscriber = false }) {
    if (isMonthlySubscriber) {
      return {
        durationMinutes: this.getDurationMinutes(checkInTime, checkOutTime),
        fee: 0,
        feeBreakdown: 'Gói vé tháng (Miễn phí lượt gửi)',
        isGracePeriod: false
      };
    }

    const checkIn = new Date(checkInTime);
    const checkOut = checkOutTime ? new Date(checkOutTime) : new Date();
    const durationMinutes = Math.max(0, Math.ceil((checkOut - checkIn) / (1000 * 60)));

    // Load active Tariff rules for tenant and vehicle type
    const tenantTariffs = MEMORY_DB.tariff_rules.filter(t => t.tenant_id === tenantId);
    const tariff = tenantTariffs.find(t => t.vehicle_type === vehicleType && t.tariff_type === 'CASUAL') || {
      base_hours: 2,
      base_fee: vehicleType === 'CAR' ? 25000 : 5000,
      extra_fee_per_hour: vehicleType === 'CAR' ? 10000 : 3000,
      grace_period_minutes: 15
    };

    // 1. Check Grace Period
    if (durationMinutes <= tariff.grace_period_minutes) {
      return {
        durationMinutes,
        fee: 0,
        feeBreakdown: `Thời gian đỗ xe < ${tariff.grace_period_minutes} phút (Thời gian gia ân miễn phí)`,
        isGracePeriod: true
      };
    }

    const totalHours = Math.ceil(durationMinutes / 60);

    // 2. Base Hours & Base Fee
    if (totalHours <= tariff.base_hours) {
      return {
        durationMinutes,
        fee: tariff.base_fee,
        feeBreakdown: `Phí cơ bản (${tariff.base_hours} giờ đầu): ${tariff.base_fee.toLocaleString('vi-VN')} VNĐ`,
        isGracePeriod: false
      };
    }

    // 3. Extra Hours Calculation
    const extraHours = totalHours - tariff.base_hours;
    const extraFee = extraHours * tariff.extra_fee_per_hour;
    const totalFee = tariff.base_fee + extraFee;

    return {
      durationMinutes,
      fee: totalFee,
      feeBreakdown: `Phí cơ bản (${tariff.base_fee.toLocaleString('vi-VN')}đ) + ${extraHours}h quá giờ (${extraFee.toLocaleString('vi-VN')}đ)`,
      isGracePeriod: false
    };
  }

  static getDurationMinutes(checkInTime, checkOutTime) {
    const checkIn = new Date(checkInTime);
    const checkOut = checkOutTime ? new Date(checkOutTime) : new Date();
    return Math.max(0, Math.ceil((checkOut - checkIn) / (1000 * 60)));
  }
}
