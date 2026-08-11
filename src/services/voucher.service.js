/**
 * Voucher Discount Validation Service
 * Integrated with Backend GET /api/vouchers/validate
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';

const MOCK_VOUCHERS = {
  'HE2024': { discountAmount: 125000, description: 'Giảm 10% đơn gia hạn' },
  'VOUCHER10': { discountAmount: 120000, description: 'Giảm 120.000đ (VOUCHER10)' },
  'TRIAN100K': { discountAmount: 100000, description: 'Giảm 100.000đ trực tiếp' }
};

export async function validateVoucher(voucherCode, originalAmount) {
  if (!voucherCode) {
    throw new Error('Vui lòng nhập mã voucher');
  }

  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 200));
    const code = voucherCode.toUpperCase().trim();
    const voucher = MOCK_VOUCHERS[code];

    if (!voucher) {
      return {
        valid: false,
        message: 'Mã voucher không hợp lệ hoặc đã hết hạn.'
      };
    }

    const discount = voucher.discountAmount;
    const finalAmount = Math.max(0, originalAmount - discount);

    return {
      valid: true,
      voucherCode: code,
      discountAmount: discount,
      finalAmount,
      description: voucher.description,
      message: `Áp dụng thành công mã ${code}`
    };
  }

  return apiRequest('/vouchers/validate', {
    params: { code: voucherCode, amount: originalAmount }
  });
}
