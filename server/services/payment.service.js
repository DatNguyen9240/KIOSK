/**
 * Universal Payment Engine Service
 * Handles Payment Orders (Aggregate Root), SePay Webhook Auto-Reconciliation,
 * Bank Transactions, Voucher Reservation, and Monthly Vehicle Renewals.
 */

import { MEMORY_DB } from '../config/database.js';
import { AuditService } from './audit.service.js';

export class PaymentService {
  /**
   * Validate a Voucher code against order amount.
   */
  static validateVoucher({ tenantId, voucherCode, orderAmount }) {
    if (!voucherCode) throw new Error('Vui lòng nhập mã voucher.');
    const voucher = (MEMORY_DB.vouchers || []).find(
      v => v.tenant_id === tenantId && v.code === voucherCode && v.is_active !== false
    );

    if (!voucher) {
      return { valid: false, message: `Mã voucher [${voucherCode}] không tồn tại hoặc đã hết hạn.` };
    }

    if (voucher.used_count >= voucher.usage_limit) {
      return { valid: false, message: `Mã voucher [${voucherCode}] đã hết lượt sử dụng.` };
    }

    if (Number(orderAmount) < Number(voucher.min_order_amount)) {
      return { valid: false, message: `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ để áp dụng voucher.` };
    }

    let discountAmount = 0;
    if (voucher.discount_type === 'PERCENTAGE' || voucher.discount_type === 'PERCENT') {
      discountAmount = Math.round((Number(orderAmount) * Number(voucher.discount_value)) / 100);
    } else {
      discountAmount = Number(voucher.discount_value);
    }

    const finalAmount = Math.max(0, Number(orderAmount) - discountAmount);

    return {
      valid: true,
      voucherCode,
      discountAmount,
      finalAmount,
      description: voucher.description || `Giảm ${discountAmount.toLocaleString('vi-VN')} VNĐ`,
      voucher
    };
  }

  /**
   * Creates a Universal Payment Order (Aggregate Root) and linked Renewal Order.
   *
   * @param {Object} params
   * @param {string} params.tenantId - Tenant UUID
   * @param {string} params.vehicleId - Vehicle UUID
   * @param {number} [params.durationMonths=1] - Renewal duration in months
   * @param {string} [params.voucherCode=null] - Voucher code (optional)
   * @param {string} [params.userId=null] - User UUID performing the order
   * @returns {Object} { paymentOrder, renewalOrder, paymentConfig }
   */
  static createRenewalOrder({ tenantId, vehicleId, durationMonths = 1, voucherCode = null, userId = null }) {
    if (!vehicleId) {
      throw new Error('Mã xe (vehicleId) không được để trống khi tạo đơn gia hạn.');
    }

    const vehicle = (MEMORY_DB.vehicles || []).find(v => v.id === vehicleId && v.tenant_id === tenantId);
    if (!vehicle) {
      throw new Error(`Xe [${vehicleId}] không tồn tại trong Tenant context.`);
    }

    // 1. Load active monthly tariff rule
    const tariff = (MEMORY_DB.tariff_rules || []).find(
      t => t.tenant_id === tenantId && t.vehicle_type === (vehicle.vehicleType || vehicle.vehicle_type) && t.tariff_type === 'MONTHLY' && t.is_active !== false
    );

    if (!tariff) {
      throw new Error(`Tenant chưa cấu hình bảng giá vé tháng (MONTHLY) cho loại xe [${vehicle.vehicleType || vehicle.vehicle_type}].`);
    }

    const originalAmount = Number(tariff.monthly_fee) * Number(durationMonths);
    let discountAmount = 0;
    let voucherObj = null;

    // 2. Validate Voucher Code if provided
    if (voucherCode) {
      voucherObj = (MEMORY_DB.vouchers || []).find(v => v.tenant_id === tenantId && v.code === voucherCode && v.is_active !== false);
      if (!voucherObj) {
        throw new Error(`Mã voucher [${voucherCode}] không hợp lệ hoặc đã hết hạn.`);
      }

      if (voucherObj.used_count >= voucherObj.usage_limit) {
        throw new Error(`Mã voucher [${voucherCode}] đã hết lượt sử dụng (Giới hạn: ${voucherObj.usage_limit}).`);
      }

      if (originalAmount < voucherObj.min_order_amount) {
        throw new Error(`Đơn hàng tối thiểu ${voucherObj.min_order_amount.toLocaleString('vi-VN')} VNĐ để áp dụng voucher này.`);
      }

      if (voucherObj.discount_type === 'PERCENTAGE' || voucherObj.discount_type === 'PERCENT') {
        discountAmount = Math.round((originalAmount * Number(voucherObj.discount_value)) / 100);
      } else {
        discountAmount = Number(voucherObj.discount_value);
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // 3. Compute New Expiry Date
    const currentExpiry = new Date(vehicle.expireDate || vehicle.expiry_date || Date.now());
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + Number(durationMonths));
    const formattedNewExpiry = newExpiryDate.toISOString().split('T')[0];

    // 4. Generate Order Code & Payment Order Aggregate Root
    const orderCode = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const paymentOrderId = `po-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const paymentOrder = {
      id: paymentOrderId,
      tenant_id: tenantId,
      order_code: orderCode,
      order_type: 'MONTHLY_RENEWAL',
      expected_amount: finalAmount,
      status: 'WAITING_PAYMENT',
      created_by: userId,
      created_at: new Date().toISOString()
    };

    // 5. Create Monthly Renewal Order Record
    const renewalOrderId = `ren-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const renewalOrder = {
      id: renewalOrderId,
      tenant_id: tenantId,
      payment_order_id: paymentOrderId,
      vehicle_id: vehicle.id,
      resident_id: vehicle.resident_id || vehicle.residentId,
      duration_months: Number(durationMonths),
      original_amount: originalAmount,
      discount_amount: discountAmount,
      voucher_id: voucherObj ? voucherObj.id : null,
      final_amount: finalAmount,
      old_expiry_date: vehicle.expireDate || vehicle.expiry_date,
      new_expiry_date: formattedNewExpiry,
      created_at: new Date().toISOString()
    };

    // 6. Fetch Tenant VietQR Configuration
    const payConfig = (MEMORY_DB.tenant_payment_configs || []).find(p => p.tenant_id === tenantId);
    if (!payConfig) {
      throw new Error(`Tenant chưa cấu hình tài khoản nhận tiền VietQR.`);
    }

    const qrTimeout = payConfig.qr_timeout_seconds || 120;

    MEMORY_DB.payment_orders = MEMORY_DB.payment_orders || [];
    MEMORY_DB.payment_orders.push(paymentOrder);

    MEMORY_DB.renewal_orders = MEMORY_DB.renewal_orders || [];
    MEMORY_DB.renewal_orders.push(renewalOrder);

    const qrUrl = `https://img.vietqr.io/image/${payConfig.bank_bin}-${payConfig.bank_account_no}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(payConfig.bank_account_name)}`;

    return {
      paymentOrder,
      renewalOrder,
      paymentConfig: {
        bankName: payConfig.bank_account_name,
        bankAccountNo: payConfig.bank_account_no,
        bankBin: payConfig.bank_bin,
        qrUrl,
        timeoutSeconds: qrTimeout
      }
    };
  }

  /**
   * Process SePay / Bank Transfer Webhook with Automated Bank Reconciliation & Idempotency.
   */
  static processSePayWebhook({ tenantId, transactionId, transferContent, amount, gateway = 'SEPAY', rawPayload = {} }) {
    if (!transactionId) {
      throw new Error('Thiếu transactionId của giao dịch ngân hàng.');
    }

    const idempotencyKey = `${tenantId}_${transactionId}`;
    MEMORY_DB.bank_transactions = MEMORY_DB.bank_transactions || [];

    // 1. Idempotency Check on Bank Transaction Log
    let bankTx = MEMORY_DB.bank_transactions.find(
      bt => bt.tenant_id === tenantId && bt.gateway === gateway && bt.transaction_id === String(transactionId)
    );

    if (bankTx && bankTx.status === 'MATCHED') {
      console.log(`[SePay Webhook] Transaction ${transactionId} already processed (Idempotent replay).`);
      return { success: true, matched: true, alreadyProcessed: true, bankTransaction: bankTx };
    }

    // 2. Parse Order Code from Transfer Content
    const orderCodeMatch = transferContent ? transferContent.match(/ORD-\d+-\d+/i) : null;
    const orderCode = orderCodeMatch ? orderCodeMatch[0].toUpperCase() : null;

    if (!orderCode) {
      console.warn(`[SePay Webhook] No order code match in content: "${transferContent}"`);
      return { success: false, matched: false, reason: 'ORDER_CODE_NOT_FOUND' };
    }

    // 3. Match Payment Order Aggregate Root
    const paymentOrder = (MEMORY_DB.payment_orders || []).find(
      po => po.tenant_id === tenantId && po.order_code === orderCode
    );

    if (!paymentOrder) {
      console.warn(`[SePay Webhook] Payment Order [${orderCode}] not found for tenant.`);
      return { success: false, matched: false, reason: 'PAYMENT_ORDER_NOT_FOUND' };
    }

    // 4. Record Bank Transaction Record
    bankTx = {
      id: `btx-${Date.now()}`,
      tenant_id: tenantId,
      gateway,
      transaction_id: String(transactionId),
      transfer_content: transferContent,
      amount: Number(amount),
      matched_order_id: paymentOrder.id,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    MEMORY_DB.bank_transactions.push(bankTx);

    // 5. Amount Verification
    if (Number(amount) < Number(paymentOrder.expected_amount)) {
      bankTx.status = 'UNDERPAID';
      console.warn(`[SePay Underpaid] Received ${amount} < Expected ${paymentOrder.expected_amount}`);
      return { success: false, matched: false, underpaid: true, expected: paymentOrder.expected_amount, received: amount };
    }

    // 6. Update Payment Order Status to PAID
    paymentOrder.status = 'PAID';
    paymentOrder.paid_amount = Number(amount);
    paymentOrder.paid_at = new Date().toISOString();
    bankTx.status = 'MATCHED';

    // 7. Process Target Action (Vehicle Renewal or Parking Session Completion)
    const renewalOrder = (MEMORY_DB.renewal_orders || []).find(r => r.payment_order_id === paymentOrder.id);
    if (renewalOrder) {
      const vehicle = MEMORY_DB.vehicles.find(v => v.id === renewalOrder.vehicle_id);
      if (vehicle) {
        const oldExpiry = vehicle.expireDate || vehicle.expiry_date;
        vehicle.expireDate = renewalOrder.new_expiry_date;
        vehicle.expiry_date = renewalOrder.new_expiry_date;
        vehicle.status = 'ACTIVE';

        AuditService.log({
          tenantId,
          userId: 'system-sepay',
          action: 'PAYMENT_SUCCESS_RENEWED',
          entityType: 'VEHICLE',
          entityId: vehicle.id,
          oldData: { expiryDate: oldExpiry },
          newData: { expiryDate: renewalOrder.new_expiry_date, orderCode }
        });
      }

      // Record Voucher Usage Audit
      if (renewalOrder.voucher_id) {
        const voucher = MEMORY_DB.vouchers.find(v => v.id === renewalOrder.voucher_id);
        if (voucher) {
          voucher.used_count = (voucher.used_count || 0) + 1;
          MEMORY_DB.voucher_usages = MEMORY_DB.voucher_usages || [];
          MEMORY_DB.voucher_usages.push({
            id: `vu-${Date.now()}`,
            tenant_id: tenantId,
            voucher_id: voucher.id,
            payment_order_id: paymentOrder.id,
            discount_amount: renewalOrder.discount_amount,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    const parkingSession = (MEMORY_DB.parking_sessions || []).find(ps => ps.payment_order_id === paymentOrder.id);
    if (parkingSession) {
      parkingSession.status = 'COMPLETED';
      parkingSession.check_out_time = new Date().toISOString();
    }

    return {
      success: true,
      matched: true,
      paymentOrder,
      bankTransaction: bankTx,
      renewalOrder,
      parkingSession
    };
  }
}
