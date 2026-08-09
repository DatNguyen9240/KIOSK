/**
 * PARKING.GO KIOSK — REST API ROUTES MATRIX
 * Enterprise Production Routing, Auth Guards & Multi-Tenant Guard
 */

import express from 'express';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { resolveTenantContext } from '../middleware/tenant-context.js';
import { PaymentService } from '../services/payment.service.js';
import { ParkingService } from '../services/parking.service.js';
import { ReportService } from '../services/report.service.js';
import { EmailService } from '../services/email.service.js';
import { AuditService } from '../services/audit.service.js';
import { MEMORY_DB } from '../config/database.js';

const router = express.Router();

// Middleware: Log request
router.use((req, res, next) => {
  next();
});

// Standard API Response Formatter
const sendSuccess = (res, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message = 'Internal Server Error', status = 500, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// PUBLIC & UNPROTECTED ROUTES (Auth & External Webhooks)
// =============================================================================

// 1. User Login Endpoint
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 'Email và Password không được để trống.', 400);
  }

  const user = MEMORY_DB.users.find(u => u.email === email.toLowerCase().trim());
  if (!user) {
    return sendError(res, 'Thông tin đăng nhập không chính xác.', 401);
  }

  const tenantUser = (MEMORY_DB.tenant_users || []).find(tu => tu.user_id === user.id);
  const activeTenantId = tenantUser ? tenantUser.tenant_id : MEMORY_DB.tenants[0].id;
  const roleObj = (MEMORY_DB.roles || []).find(r => r.id === tenantUser?.role_id);
  const role = tenantUser ? (roleObj ? roleObj.code : 'TENANT_ADMIN') : (user.isSuperAdmin || user.is_super_admin ? 'SUPER_ADMIN' : 'VIEWER');

  const token = generateToken(user, activeTenantId, role);

  AuditService.log({
    tenantId: activeTenantId,
    userId: user.id,
    action: 'USER_LOGIN_SUCCESS',
    entityType: 'USER',
    entityId: user.id
  });

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name,
      isSuperAdmin: !!user.isSuperAdmin || !!user.is_super_admin,
      activeTenantId,
      role
    }
  });
});

// 2. SePay Bank Webhook Receiver (Public Endpoint called directly by SePay Gateway)
router.post('/webhooks/payment/sepay', (req, res) => {
  try {
    const { transactionId, id, transferContent, content, amount, transferAmount, accountNumber, gateway } = req.body;
    const tenantIdHeader = req.headers['x-tenant-id'] || null;

    let authHeader = req.headers['x-sepay-secret'] || null;
    const auth = req.headers['authorization'] || '';
    if (auth.toLowerCase().startsWith('apikey')) {
      authHeader = auth;
    }

    const result = PaymentService.processSePayWebhook({
      tenantId: tenantIdHeader,
      transactionId: transactionId || id,
      transferContent: transferContent || content,
      amount: amount || transferAmount,
      accountNumber,
      gateway: gateway || 'SEPAY',
      authHeader
    });

    if (!result.success && result.reason === 'INVALID_SEPAY_SECRET') {
      return sendError(res, 'Invalid SePay Secret Key', 401);
    }

    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// =============================================================================
// PROTECTED MULTI-TENANT API ROUTES (Requires Authorization & X-Tenant-ID Header)
// =============================================================================
router.use(authenticateToken);
router.use(resolveTenantContext);

// --- TENANTS METADATA ---
router.get('/tenants', (req, res) => {
  if (req.user.isSuperAdmin) {
    return sendSuccess(res, { tenants: MEMORY_DB.tenants });
  }
  const userTenants = (MEMORY_DB.tenant_users || [])
    .filter(tu => tu.user_id === req.user.userId)
    .map(tu => MEMORY_DB.tenants.find(t => t.id === tu.tenant_id))
    .filter(Boolean);

  return sendSuccess(res, { tenants: userTenants });
});

router.get('/tenants/current', (req, res) => {
  const tenant = MEMORY_DB.tenants.find(t => t.id === req.tenantId);
  if (!tenant) return sendError(res, 'Không tìm thấy Tenant.', 404);
  return sendSuccess(res, { tenant });
});

// --- VEHICLE MANAGEMENT ---
router.get('/vehicles/search', (req, res) => {
  const { q = '', type = 'ALL' } = req.query;
  const term = q.toLowerCase().trim();

  let vehicles = MEMORY_DB.vehicles.filter(v => v.tenant_id === req.tenantId);

  if (term) {
    vehicles = vehicles.filter(v => {
      const plate = (v.plateNumber || v.plate_number || '').toLowerCase();
      const norm = (v.plateNormalized || v.plate_normalized || '').toLowerCase();
      const name = (v.residentName || v.resident_name || '').toLowerCase();
      const apt = (v.apartmentNumber || v.apartment_number || '').toLowerCase();
      const card = (v.cardNumber || v.card_number || '').toLowerCase();

      if (type === 'PLATE') return plate.includes(term) || norm.includes(term);
      if (type === 'NAME') return name.includes(term);
      if (type === 'APARTMENT') return apt.includes(term);
      if (type === 'CARD') return card.includes(term);

      return plate.includes(term) || norm.includes(term) || name.includes(term) || apt.includes(term) || card.includes(term);
    });
  }

  return sendSuccess(res, { vehicles, total: vehicles.length });
});

router.post('/vehicles', (req, res) => {
  const { plateNumber, residentName, apartmentNumber, vehicleType, cardNumber } = req.body;
  if (!plateNumber || !residentName || !apartmentNumber) {
    return sendError(res, 'Vui lòng điền đầy đủ biển số, tên cư dân và số căn hộ.', 400);
  }

  const normalizedPlate = plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const vehicle = {
    id: `V${Date.now().toString().slice(-4)}`,
    tenant_id: req.tenantId,
    plateNumber,
    plateNormalized: normalizedPlate,
    residentName,
    apartmentNumber,
    vehicleType: vehicleType || 'CAR',
    cardNumber: cardNumber || `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'ACTIVE',
    expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  MEMORY_DB.vehicles.push(vehicle);
  AuditService.log({
    tenantId: req.tenantId,
    userId: req.user.userId,
    action: 'CREATE_VEHICLE',
    entityType: 'VEHICLE',
    entityId: vehicle.id,
    newData: vehicle
  });

  return sendSuccess(res, { vehicle }, 201);
});

// --- TARIFF RULES & VOUCHERS ---
router.get('/tariffs', (req, res) => {
  const tariffs = (MEMORY_DB.tariff_rules || []).filter(t => t.tenant_id === req.tenantId && t.is_active !== false);
  const tiers = (MEMORY_DB.tariff_tiers || []).filter(t => t.tenant_id === req.tenantId);
  return sendSuccess(res, { tariffs, tiers });
});

router.get('/vouchers/validate', (req, res) => {
  const { code, amount } = req.query;
  if (!code || !amount) return sendError(res, 'Vui lòng cung cấp mã voucher và số tiền đơn hàng.', 400);

  const voucher = (MEMORY_DB.vouchers || []).find(v => v.tenant_id === req.tenantId && v.code === code && v.is_active !== false);

  if (!voucher) return sendError(res, 'Mã voucher không hợp lệ hoặc đã hết hạn.', 404);
  if (voucher.used_count >= voucher.usage_limit) return sendError(res, 'Mã voucher đã hết lượt sử dụng.', 400);

  if (Number(amount) < voucher.min_order_amount) {
    return sendError(res, `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ để áp dụng mã này.`, 400);
  }

  let discount = (voucher.discount_type === 'PERCENT' || voucher.discount_type === 'PERCENTAGE')
    ? (Number(amount) * voucher.discount_value) / 100 
    : Number(voucher.discount_value);
  discount = Math.min(discount, Number(amount));

  return sendSuccess(res, { valid: true, voucher, discountAmount: discount, finalAmount: Number(amount) - discount });
});

// --- RENEWAL ORDERS & PAYMENTS ---
router.post('/orders/renewal', (req, res) => {
  try {
    const { vehicleId, durationMonths = 1, voucherCode = null } = req.body;
    const result = PaymentService.createRenewalOrder({
      tenantId: req.tenantId,
      vehicleId,
      durationMonths,
      voucherCode,
      userId: req.user.userId
    });

    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// --- PARKING KIOSK SESSIONS & GATES ---
router.post('/parking/check-in', (req, res) => {
  try {
    const { plateNumber, cardNumber, gateInId } = req.body;
    const result = ParkingService.checkIn({
      tenantId: req.tenantId,
      plateNumber,
      cardNumber,
      gateInId
    });

    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

router.post('/parking/check-out', (req, res) => {
  try {
    const { plateNumber, gateOutId } = req.body;
    const result = ParkingService.checkOut({
      tenantId: req.tenantId,
      plateNumber,
      gateOutId
    });

    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

router.get('/parking/sessions', (req, res) => {
  const sessions = (MEMORY_DB.parking_sessions || []).filter(s => s.tenant_id === req.tenantId);
  return sendSuccess(res, { sessions, total: sessions.length });
});

// --- REPORTS & DEBT ANALYTICS ---
router.get('/reports/tower', (req, res) => {
  try {
    const report = ReportService.getReportByTower(req.tenantId);
    return sendSuccess(res, report);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// --- NOTIFICATIONS & REMINDERS ---
router.post('/notifications/remind-expiring', (req, res) => {
  try {
    const { daysThreshold = 30 } = req.body;
    const result = EmailService.scanAndSendExpiryReminders({
      tenantId: req.tenantId,
      daysThreshold
    });

    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// --- AUDIT LOGS ---
router.get('/audit-logs', (req, res) => {
  const logs = AuditService.getLogs(req.tenantId);
  return sendSuccess(res, { logs, total: logs.length });
});

export default router;
