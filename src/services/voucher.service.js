/**
 * Voucher Discount Validation Service
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';

const MOCK_VOUCHERS = {
  'GIAM10K': { discountAmount: 10000, description: 'Giảm 10.000đ trực tiếp' },
  'PARKING50': { discountPercent: 50, maxDiscount: 30000, description: 'Giảm 50% tối đa 30.000đ' },
  'CUDANVIP': { discountAmount: 20000, description: 'Ưu đãi Cư Dân VIP -20.000đ' }
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

    let discount = 0;
    if (voucher.discountAmount) {
      discount = voucher.discountAmount;
    } else if (voucher.discountPercent) {
      discount = Math.min((originalAmount * voucher.discountPercent) / 100, voucher.maxDiscount || 999999);
    }

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

  return apiRequest('/voucher/validate', {
    method: 'POST',
    body: { code: voucherCode, amount: originalAmount }
  });
}
