/**
 * Universal Payment Engine Service
 * Handles Payment Orders (Aggregate Root), SePay Webhook Auto-Reconciliation,
 * Bank Transactions, Voucher Reservation, and Monthly Vehicle Renewals.
 */

import { MEMORY_DB } from '../config/database.js';
import { AuditService } from './audit.service.js';

export class PaymentService {
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
        discountAmount = (originalAmount * voucherObj.discount_value) / 100;
      } else {
        discountAmount = Number(voucherObj.discount_value);
      }

      discountAmount = Math.min(discountAmount, originalAmount);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const orderCode = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // 3. Load Tenant Payment Configuration (Zero Hardcoding)
    const payConfig = (MEMORY_DB.tenant_payment_configs || []).find(c => c.tenant_id === tenantId && c.is_active !== false);
    if (!payConfig) {
      throw new Error(`Tenant chưa cấu hình tài khoản ngân hàng nhận tiền (tenant_payment_configs).`);
    }

    // 4. Calculate updated vehicle expiry date
    const currentExpiry = new Date(vehicle.expireDate || vehicle.expiry_date || Date.now());
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + Number(durationMonths));
    const formattedNewExpiry = newExpiryDate.toISOString().split('T')[0];

    // 5. Create Universal Payment Order (Aggregate Root)
    const qrTimeout = payConfig.qr_timeout_seconds || 900;
    const expiresAt = new Date(Date.now() + qrTimeout * 1000).toISOString();

    const paymentOrder = {
      id: `pord-${Date.now()}`,
      tenant_id: tenantId,
      order_code: orderCode,
      expected_amount: finalAmount,
      paid_amount: 0,
      currency: 'VND',
      status: 'WAITING_PAYMENT',
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    MEMORY_DB.payment_orders = MEMORY_DB.payment_orders || [];
    MEMORY_DB.payment_orders.push(paymentOrder);

    // 6. Create Linked Renewal Order Record
    const renewalOrder = {
      id: `ren-${Date.now()}`,
      tenant_id: tenantId,
      payment_order_id: paymentOrder.id,
      vehicle_id: vehicle.id,
      plate_number: vehicle.plateNumber || vehicle.plate_number,
      vehicle_type: vehicle.vehicleType || vehicle.vehicle_type,
      duration_months: Number(durationMonths),
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      voucher_id: voucherObj ? voucherObj.id : null,
      new_expiry_date: formattedNewExpiry,
      created_at: new Date().toISOString()
    };

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
      return { success: true, alreadyProcessed: true, bankTransaction: bankTx };
    }

    // 2. Resolve Payment Config for this Tenant
    const payConfig = (MEMORY_DB.tenant_payment_configs || []).find(c => c.tenant_id === tenantId && c.is_active !== false);

    // 3. Log Raw Bank Feed Record if not existing
    if (!bankTx) {
      bankTx = {
        id: `btx-${Date.now()}`,
        tenant_id: tenantId,
        tenant_payment_config_id: payConfig ? payConfig.id : null,
        bank_account_no: rawPayload.accountNumber || (payConfig ? payConfig.bank_account_no : 'N/A'),
        gateway,
        transaction_id: String(transactionId),
        direction: 'CREDIT',
        amount: Number(amount),
        transfer_content: transferContent || '',
        reference_code: null,
        status: 'UNMATCHED',
        payment_order_id: null,
        transaction_time: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      MEMORY_DB.bank_transactions.push(bankTx);
    }

    // 4. Extract Order Code from Transfer Content (e.g. "ORD-123456-789")
    const orderCodeMatch = (transferContent || '').match(/ORD-[A-Z0-9-]+/i);
    if (!orderCodeMatch) {
      console.warn(`[SePay Auto-Match Fail] Could not extract order code from transfer content: "${transferContent}"`);
      return { success: false, matched: false, message: 'Không tìm thấy mã đơn hàng trong nội dung chuyển khoản.' };
    }

    const orderCode = orderCodeMatch[0].toUpperCase();
    bankTx.reference_code = orderCode;

    // 5. Locate Payment Order Aggregate Root
    MEMORY_DB.payment_orders = MEMORY_DB.payment_orders || [];
    const paymentOrder = MEMORY_DB.payment_orders.find(po => po.tenant_id === tenantId && po.order_code === orderCode);

    if (!paymentOrder) {
      throw new Error(`Đơn hàng thanh toán [${orderCode}] không tồn tại trong Tenant context.`);
    }

    if (paymentOrder.status === 'PAID') {
      bankTx.status = 'MATCHED';
      bankTx.payment_order_id = paymentOrder.id;
      return { success: true, alreadyProcessed: true, message: 'Đơn hàng đã được đánh dấu PAID trước đó.' };
    }

    // 6. Amount Verification
    if (Number(amount) < Number(paymentOrder.expected_amount)) {
      console.warn(`[SePay Underpaid] Received ${amount} < Expected ${paymentOrder.expected_amount}`);
      paymentOrder.paid_amount = Number(amount);
      return { success: false, underpaid: true, expected: paymentOrder.expected_amount, received: amount };
    }

    // 7. Record Payment Transaction Attempt
    MEMORY_DB.payment_transactions = MEMORY_DB.payment_transactions || [];
    const txRecord = {
      id: `tx-${Date.now()}`,
      tenant_id: tenantId,
      payment_order_id: paymentOrder.id,
      provider: gateway,
      gateway_transaction_id: String(transactionId),
      bank_reference: String(transactionId),
      expected_amount: Number(paymentOrder.expected_amount),
      received_amount: Number(amount),
      currency: 'VND',
      status: 'SUCCESS',
      idempotency_key: idempotencyKey,
      raw_payload: rawPayload,
      processed_at: new Date().toISOString()
    };
    MEMORY_DB.payment_transactions.push(txRecord);

    // 8. Update Payment Order & Bank Transaction State
    paymentOrder.status = 'PAID';
    paymentOrder.paid_amount = Number(amount);
    paymentOrder.paid_at = new Date().toISOString();

    bankTx.status = 'MATCHED';
    bankTx.payment_order_id = paymentOrder.id;

    // 9. Process Target Action (Vehicle Renewal or Parking Session Completion)
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
