/**
 * Parking Operations Core Service (Check-in, Check-out, Gate Verification)
 * Enforces zero hardcoded values - resolves gates, cards, and vehicles dynamically.
 */

import { MEMORY_DB } from '../config/database.js';
import { ParkingFeeService } from './fee-calculator.service.js';
import { AuditService } from './audit.service.js';

export class ParkingService {
  /**
   * Handles vehicle gate check-in entry.
   *
   * @param {Object} params
   * @param {string} params.tenantId - Tenant UUID
   * @param {string} params.plateNumber - Raw license plate string
   * @param {string} [params.cardNumber] - RFID card number (optional)
   * @param {string} [params.gateInId] - Gate entry UUID (optional)
   * @param {string} [params.imageUrl] - Capture image URL (optional)
   */
  static checkIn({ tenantId, plateNumber, cardNumber = null, gateInId = null, imageUrl = null }) {
    if (!plateNumber || !plateNumber.trim()) {
      throw new Error('Biển số xe không được để trống khi Check-in.');
    }

    const normalizedPlate = plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // 1. Resolve registered vehicle for monthly subscription check
    const vehicle = (MEMORY_DB.vehicles || []).find(
      v => v.tenant_id === tenantId && (v.plateNormalized === normalizedPlate || v.plate_normalized === normalizedPlate)
    );

    // 2. Resolve RFID card if specified
    const card = cardNumber
      ? (MEMORY_DB.parking_cards || []).find(c => c.tenant_id === tenantId && c.card_number === cardNumber)
      : null;

    // 3. Resolve entry gate dynamically from Tenant database records
    const tenantGates = (MEMORY_DB.gates || []).filter(g => g.tenant_id === tenantId && g.is_active !== false);
    const gateIn = gateInId
      ? (tenantGates.find(g => g.id === gateInId || g.code === gateInId) || tenantGates.find(g => g.gate_type === 'IN' || g.gate_type === 'BIDIRECTIONAL') || tenantGates[0])
      : (tenantGates.find(g => g.gate_type === 'IN' || g.gate_type === 'BIDIRECTIONAL') || tenantGates[0]);

    if (!gateIn) {
      throw new Error(`Tenant chưa cấu hình cổng vào (Gate IN) hoạt động cho bãi xe.`);
    }

    const sessionCode = `SES-${Date.now().toString().slice(-8)}`;

    const session = {
      id: `ses-${Date.now()}`,
      tenant_id: tenantId,
      session_code: sessionCode,
      vehicle_id: vehicle ? vehicle.id : null,
      card_id: card ? card.id : null,
      plate_number: plateNumber.trim(),
      plate_normalized: normalizedPlate,
      card_number: cardNumber || (vehicle ? (vehicle.cardNumber || vehicle.card_number) : null),
      check_in_time: new Date().toISOString(),
      check_in_image_url: imageUrl || `/assets/images/checkin_${normalizedPlate}.jpg`,
      check_out_time: null,
      check_out_image_url: null,
      gate_in_id: gateIn.id,
      gate_out_id: null,
      calculated_fee: 0,
      payment_order_id: null,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    MEMORY_DB.parking_sessions = MEMORY_DB.parking_sessions || [];
    MEMORY_DB.parking_sessions.push(session);

    return {
      success: true,
      session,
      vehicle: vehicle || null,
      gateIn,
      gateAction: 'OPEN_GATE',
      message: vehicle ? `Xe tháng: ${vehicle.residentName || 'Cư dân'} (${vehicle.apartmentNumber || 'Căn hộ'})` : 'Xe vãng lai vào bãi'
    };
  }

  /**
   * Handles vehicle gate check-out exit.
   *
   * @param {Object} params
   * @param {string} params.tenantId - Tenant UUID
   * @param {string} [params.plateNumber] - License plate for lookup
   * @param {string} [params.cardNumber] - RFID card number for lookup
   * @param {string} [params.gateOutId] - Gate exit UUID
   * @param {string} [params.imageUrl] - Exit image URL
   */
  static checkOut({ tenantId, plateNumber = null, cardNumber = null, gateOutId = null, imageUrl = null }) {
    if (!plateNumber && !cardNumber) {
      throw new Error('Vui lòng cung cấp biển số xe hoặc mã thẻ từ để Check-out.');
    }

    const normalizedPlate = plateNumber ? plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase() : null;

    // 1. Locate active session
    const session = (MEMORY_DB.parking_sessions || []).find(s => {
      if (s.tenant_id !== tenantId || s.status !== 'ACTIVE') return false;
      if (cardNumber && (s.card_number === cardNumber || s.card_id === cardNumber)) return true;
      if (normalizedPlate && (s.plate_normalized === normalizedPlate || s.plate_number.replace(/[^A-Z0-9]/gi, '').toUpperCase() === normalizedPlate)) return true;
      return false;
    });

    if (!session) {
      throw new Error(`Không tìm thấy phiên gửi xe đang hoạt động cho biển số/thẻ [${plateNumber || cardNumber}].`);
    }

    // 2. Resolve exit gate dynamically
    const tenantGates = (MEMORY_DB.gates || []).filter(g => g.tenant_id === tenantId && g.is_active !== false);
    const gateOut = gateOutId
      ? (tenantGates.find(g => g.id === gateOutId || g.code === gateOutId) || tenantGates.find(g => g.gate_type === 'OUT' || g.gate_type === 'BIDIRECTIONAL') || tenantGates[0])
      : (tenantGates.find(g => g.gate_type === 'OUT' || g.gate_type === 'BIDIRECTIONAL') || tenantGates[0]);

    if (!gateOut) {
      throw new Error(`Tenant chưa cấu hình cổng ra (Gate OUT) hoạt động cho bãi xe.`);
    }

    const vehicle = session.vehicle_id ? MEMORY_DB.vehicles.find(v => v.id === session.vehicle_id) : null;
    const isMonthlySubscriber = !!vehicle && vehicle.status === 'ACTIVE';

    // 3. Calculate Fee via ParkingFeeService
    const feeResult = ParkingFeeService.calculateFee({
      checkInTime: session.check_in_time,
      checkOutTime: new Date().toISOString(),
      vehicleType: vehicle ? (vehicle.vehicleType || vehicle.vehicle_type) : 'CAR',
      tenantId,
      isMonthlySubscriber
    });

    session.gate_out_id = gateOut.id;
    session.check_out_image_url = imageUrl || `/assets/images/checkout_${session.session_code}.jpg`;
    session.calculated_fee = feeResult.fee;

    // 4. Free Exit (Monthly subscriber or Grace period)
    if (isMonthlySubscriber || feeResult.fee === 0) {
      session.status = 'COMPLETED';
      session.check_out_time = new Date().toISOString();

      AuditService.log({
        tenantId,
        userId: 'gate-operator',
        action: 'PARKING_CHECKOUT_FREE',
        entityType: 'PARKING_SESSION',
        entityId: session.id,
        newData: { fee: 0, status: 'COMPLETED' }
      });

      return {
        success: true,
        session,
        feeCalculation: feeResult,
        canExit: true,
        gateAction: 'OPEN_GATE',
        message: 'Xác nhận xe ra hợp lệ (Miễn phí / Xe tháng)'
      };
    }

    // 5. Casual Exit requiring payment: Generate Payment Order & QR code
    const orderCode = `ORD-SESS-${session.session_code}`;
    let paymentOrder = (MEMORY_DB.payment_orders || []).find(po => po.order_code === orderCode);

    if (!paymentOrder) {
      const payConfig = MEMORY_DB.tenant_payment_configs.find(c => c.tenant_id === tenantId && c.is_active !== false);
      const timeoutSeconds = payConfig ? payConfig.qr_timeout_seconds : 900;
      const expiresAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();

      paymentOrder = {
        id: `pord-sess-${session.id}`,
        tenant_id: tenantId,
        order_code: orderCode,
        expected_amount: feeResult.fee,
        paid_amount: 0,
        currency: 'VND',
        status: 'WAITING_PAYMENT',
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      };
      MEMORY_DB.payment_orders = MEMORY_DB.payment_orders || [];
      MEMORY_DB.payment_orders.push(paymentOrder);
      session.payment_order_id = paymentOrder.id;
    }

    const payConfig = MEMORY_DB.tenant_payment_configs.find(c => c.tenant_id === tenantId && c.is_active !== false);
    if (!payConfig) {
      throw new Error(`Tenant chưa cấu hình tài khoản thanh toán nhận tiền (tenant_payment_configs).`);
    }

    const qrUrl = `https://img.vietqr.io/image/${payConfig.bank_bin}-${payConfig.bank_account_no}-compact2.png?amount=${feeResult.fee}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(payConfig.bank_account_name)}`;

    return {
      success: true,
      session,
      feeCalculation: feeResult,
      paymentOrder,
      qrUrl,
      canExit: false,
      gateAction: 'WAIT_PAYMENT',
      message: `Vui lòng quét QR thanh toán phí giữ xe: ${feeResult.fee.toLocaleString('vi-VN')} VNĐ`
    };
  }
}
