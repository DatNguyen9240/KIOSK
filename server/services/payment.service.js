/**
 * Payment & Order Management Engine
 * Handles Order creation, Voucher validation, VietQR generation, and Idempotent Webhook Processing.
 */

import { MEMORY_DB } from '../config/database.js';
import { AuditService } from './audit.service.js';

export class PaymentService {
  /**
   * Creates a monthly renewal order for a vehicle.
   */
  static createRenewalOrder({ tenantId, vehicleId, durationMonths = 1, voucherCode = null }) {
    const vehicle = MEMORY_DB.vehicles.find(v => v.id === vehicleId && v.tenant_id === tenantId);
    if (!vehicle) {
      throw new Error(`Vehicle [${vehicleId}] not found in active Tenant context`);
    }

    // Get tariff rule for monthly subscription
    const tariff = MEMORY_DB.tariff_rules.find(
      t => t.tenant_id === tenantId && t.vehicle_type === vehicle.vehicleType && t.tariff_type === 'MONTHLY'
    ) || { monthly_fee: vehicle.vehicleType === 'CAR' ? 1250000 : 120000 };

    const originalAmount = tariff.monthly_fee * durationMonths;
    let discountAmount = 0;
    let voucherObj = null;

    // Validate Voucher Code if provided
    if (voucherCode) {
      voucherObj = MEMORY_DB.vouchers.find(v => v.tenant_id === tenantId && v.code === voucherCode && v.is_active);
      if (!voucherObj) {
        throw new Error(`Voucher code [${voucherCode}] is invalid or expired for this Tenant`);
      }

      if (originalAmount < voucherObj.min_order_amount) {
        throw new Error(`Order amount does not meet voucher minimum requirement (${voucherObj.min_order_amount.toLocaleString('vi-VN')} VNĐ)`);
      }

      if (voucherObj.discount_type === 'PERCENT') {
        discountAmount = (originalAmount * voucherObj.discount_value) / 100;
      } else {
        discountAmount = voucherObj.discount_value;
      }

      discountAmount = Math.min(discountAmount, originalAmount);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const orderCode = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Calculate updated vehicle expiry date
    const currentExpiry = new Date(vehicle.expireDate || vehicle.expiry_date || Date.now());
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + Number(durationMonths));
    const formattedNewExpiry = newExpiryDate.toISOString().split('T')[0];

    const order = {
      id: `ord-${Date.now()}`,
      tenant_id: tenantId,
      order_code: orderCode,
      vehicle_id: vehicle.id,
      plate_number: vehicle.plateNumber || vehicle.plate_number,
      vehicle_type: vehicle.vehicleType,
      duration_months: durationMonths,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      voucher_id: voucherObj ? voucherObj.id : null,
      status: 'WAITING_PAYMENT',
      new_expiry_date: formattedNewExpiry,
      created_at: new Date().toISOString()
    };

    MEMORY_DB.renewal_orders.push(order);

    // Fetch tenant payment config for VietQR QR code generation
    const payConfig = MEMORY_DB.tenant_payment_configs.find(c => c.tenant_id === tenantId) || {
      bank_bin: '970422',
      bank_account_no: '110022334455',
      bank_account_name: 'BQL CHUNG CU'
    };

    const qrUrl = `https://img.vietqr.io/image/${payConfig.bank_bin}-${payConfig.bank_account_no}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(payConfig.bank_account_name)}`;

    return {
      order,
      paymentConfig: {
        bankName: payConfig.bank_account_name,
        bankAccountNo: payConfig.bank_account_no,
        bankBin: payConfig.bank_bin,
        qrUrl,
        timeoutSeconds: payConfig.qr_timeout_seconds || 120
      }
    };
  }

  /**
   * Process Bank / E-Wallet Webhooks with strict Idempotency Verification.
   * Section 16 & 32: Ensures identical webhooks are never processed multiple times.
   */
  static processPaymentWebhook({ tenantId, gatewayTransactionId, orderCode, amount, provider = 'VIETQR', rawPayload = {} }) {
    const idempotencyKey = `${tenantId}_${gatewayTransactionId}`;

    // 1. Idempotency Check
    const existingTx = MEMORY_DB.payment_transactions.find(
      t => t.tenant_id === tenantId && (t.gateway_transaction_id === gatewayTransactionId || t.idempotency_key === idempotencyKey)
    );

    if (existingTx) {
      console.log(`[Idempotency Lock] Webhook transaction [${gatewayTransactionId}] already processed.`);
      return {
        success: true,
        alreadyProcessed: true,
        transaction: existingTx,
        message: 'Webhook idempotently ignored (already processed).'
      };
    }

    // 2. Locate Matching Order
    const order = MEMORY_DB.renewal_orders.find(o => o.tenant_id === tenantId && o.order_code === orderCode);
    if (!order) {
      throw new Error(`Order [${orderCode}] not found for Tenant [${tenantId}]`);
    }

    if (order.status === 'PAID') {
      return { success: true, alreadyProcessed: true, message: 'Order is already marked PAID.' };
    }

    // 3. Amount Validation
    if (Number(amount) < Number(order.final_amount)) {
      throw new Error(`Payment amount (${amount}) is less than required order amount (${order.final_amount})`);
    }

    // 4. Create Payment Transaction Record
    const txRecord = {
      id: `tx-${Date.now()}`,
      tenant_id: tenantId,
      order_id: order.id,
      provider,
      gateway_transaction_id: gatewayTransactionId,
      amount: Number(amount),
      payment_method: 'BANK_TRANSFER',
      status: 'SUCCESS',
      idempotency_key: idempotencyKey,
      raw_payload: rawPayload,
      processed_at: new Date().toISOString()
    };

    MEMORY_DB.payment_transactions.push(txRecord);

    // 5. Update Order Status
    order.status = 'PAID';
    order.paid_at = new Date().toISOString();

    // 6. Extend Vehicle Expiration Date
    const vehicle = MEMORY_DB.vehicles.find(v => v.id === order.vehicle_id);
    if (vehicle) {
      const oldExpiry = vehicle.expireDate || vehicle.expiry_date;
      vehicle.expireDate = order.new_expiry_date;
      vehicle.expiry_date = order.new_expiry_date;
      vehicle.status = 'ACTIVE';

      // Audit Trail
      AuditService.log({
        tenantId,
        userId: 'system-webhook',
        action: 'PAYMENT_SUCCESS_VEHICLE_RENEWED',
        entityType: 'VEHICLE',
        entityId: vehicle.id,
        oldData: { expiryDate: oldExpiry, status: vehicle.status },
        newData: { expiryDate: order.new_expiry_date, status: 'ACTIVE', orderCode }
      });
    }

    // Increments Voucher usage count if voucher was applied
    if (order.voucher_id) {
      const voucher = MEMORY_DB.vouchers.find(v => v.id === order.voucher_id);
      if (voucher) voucher.used_count = (voucher.used_count || 0) + 1;
    }

    return {
      success: true,
      alreadyProcessed: false,
      transaction: txRecord,
      order,
      vehicle
    };
  }
}
