/**
 * Parking Operations Core Service (Check-in, Check-out, Fee Audit)
 */

import { MEMORY_DB } from '../config/database.js';
import { ParkingFeeService } from './fee-calculator.service.js';
import { AuditService } from './audit.service.js';

export class ParkingService {
  /**
   * Handles vehicle gate check-in entry.
   */
  static checkIn({ tenantId, plateNumber, cardNumber = null, gateInId = 'GATE-IN-01', imageUrl = null }) {
    const normalizedPlate = plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Check if vehicle has active monthly registration
    const vehicle = MEMORY_DB.vehicles.find(
      v => v.tenant_id === tenantId && (v.plateNormalized === normalizedPlate || v.plate_normalized === normalizedPlate)
    );

    const sessionCode = `SES-${Date.now().toString().slice(-8)}`;

    const session = {
      id: `ses-${Date.now()}`,
      tenant_id: tenantId,
      session_code: sessionCode,
      plate_number: plateNumber,
      card_number: cardNumber || (vehicle ? vehicle.cardNumber : null),
      check_in_time: new Date().toISOString(),
      check_in_image_url: imageUrl || `/assets/images/checkin_${normalizedPlate}.jpg`,
      check_out_time: null,
      check_out_image_url: null,
      calculated_fee: 0,
      payment_status: vehicle && vehicle.status === 'ACTIVE' ? 'PAID' : 'UNPAID',
      gate_in_id: gateInId,
      gate_out_id: null,
      vehicle_id: vehicle ? vehicle.id : null,
      is_monthly: !!vehicle && vehicle.status === 'ACTIVE',
      created_at: new Date().toISOString()
    };

    MEMORY_DB.parking_sessions.push(session);

    return {
      success: true,
      session,
      vehicle: vehicle || null,
      gateAction: 'OPEN_GATE',
      message: vehicle ? `Xe tháng: ${vehicle.residentName} (${vehicle.apartmentNumber})` : 'Xe vãng lai vào bãi'
    };
  }

  /**
   * Handles vehicle gate check-out exit.
   */
  static checkOut({ tenantId, plateNumber = null, cardNumber = null, gateOutId = 'GATE-OUT-01', imageUrl = null }) {
    const normalizedPlate = plateNumber ? plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase() : null;

    // Find active parking session without checkout timestamp
    const session = MEMORY_DB.parking_sessions.find(s => {
      if (s.tenant_id !== tenantId || s.check_out_time !== null) return false;
      if (cardNumber && s.card_number === cardNumber) return true;
      if (normalizedPlate && s.plate_number.replace(/[^A-Z0-9]/gi, '').toUpperCase() === normalizedPlate) return true;
      return false;
    });

    if (!session) {
      throw new Error(`Active parking session not found for plate [${plateNumber || cardNumber}] in Tenant context.`);
    }

    // Vehicle verification
    const vehicle = session.vehicle_id ? MEMORY_DB.vehicles.find(v => v.id === session.vehicle_id) : null;
    const isMonthlySubscriber = !!vehicle && vehicle.status === 'ACTIVE';

    // Calculate parking fee
    const feeResult = ParkingFeeService.calculateFee({
      checkInTime: session.check_in_time,
      checkOutTime: new Date().toISOString(),
      vehicleType: vehicle ? vehicle.vehicleType : 'CAR',
      tenantId,
      isMonthlySubscriber
    });

    session.check_out_time = new Date().toISOString();
    session.check_out_image_url = imageUrl || `/assets/images/checkout_${session.session_code}.jpg`;
    session.calculated_fee = feeResult.fee;
    session.gate_out_id = gateOutId;

    if (isMonthlySubscriber || feeResult.fee === 0) {
      session.payment_status = 'PAID';
    }

    AuditService.log({
      tenantId,
      userId: 'gate-operator',
      action: 'PARKING_CHECKOUT',
      entityType: 'PARKING_SESSION',
      entityId: session.id,
      newData: { fee: feeResult.fee, duration: feeResult.durationMinutes, paymentStatus: session.payment_status }
    });

    return {
      success: true,
      session,
      feeCalculation: feeResult,
      canExit: session.payment_status === 'PAID',
      gateAction: session.payment_status === 'PAID' ? 'OPEN_GATE' : 'WAIT_PAYMENT',
      message: session.payment_status === 'PAID' ? 'Xác nhận xe ra hợp lệ' : `Vui lòng thanh toán phí giữ xe: ${feeResult.fee.toLocaleString('vi-VN')} VNĐ`
    };
  }
}
