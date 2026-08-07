/**
 * Resident Monthly Card Renewal Service
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';

const MONTHLY_RATES = {
  CAR: 1200000,       // 1.200.000đ / tháng
  MOTORBIKE: 100000,  // 100.000đ / tháng
  BICYCLE: 30000,     // 30.000đ / tháng
  ELECTRIC_BIKE: 60000// 60.000đ / tháng
};

export async function calculateRenewalFee({ vehicleType, months = 1, fromDate, toDate }) {
  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 100));
    const ratePerMonth = MONTHLY_RATES[vehicleType] || 100000;
    const baseFee = ratePerMonth * months;

    return {
      success: true,
      months,
      ratePerMonth,
      baseFee,
      totalAmount: baseFee
    };
  }

  return apiRequest('/renewal/calculate-fee', {
    method: 'POST',
    body: { vehicleType, months, fromDate, toDate }
  });
}

export async function submitRenewalRequest(renewalData) {
  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 300));
    return {
      success: true,
      requestId: 'REN-' + Math.floor(10000 + Math.random() * 90000),
      message: 'Tạo đăng ký gia hạn thành công'
    };
  }

  return apiRequest('/renewal/submit', { method: 'POST', body: renewalData });
}
