/**
 * Resident Monthly Card Renewal Service
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';

const MONTHLY_RATES = {
  CAR: 1250000,
  MOTORBIKE: 120000,
  ELECTRIC_BIKE: 80000
};

export async function calculateRenewalFee({ vehicleType, months = 1 }) {
  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 100));
    const ratePerMonth = MONTHLY_RATES[vehicleType] || 120000;
    const baseFee = ratePerMonth * months;

    return {
      success: true,
      months,
      ratePerMonth,
      baseFee,
      totalAmount: baseFee
    };
  }

  return apiRequest('/tariffs');
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

  return apiRequest('/orders/renewal', { method: 'POST', body: renewalData });
}
