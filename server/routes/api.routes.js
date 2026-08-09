/**
 * Master REST API Controller Routes
 * Multi-Tenant Protected & RBAC Authorization Pipeline
 */

import express from 'express';
import { authenticate, generateToken } from '../middleware/auth.js';
import { resolveTenantContext } from '../middleware/tenant-context.js';
import { requirePermission } from '../middleware/rbac.js';
import { MEMORY_DB } from '../config/database.js';
import { PaymentService } from '../services/payment.service.js';
import { ParkingService } from '../services/parking.service.js';
import { AuditService } from '../services/audit.service.js';
import { ReportService } from '../services/report.service.js';
import { EmailService } from '../services/email.service.js';

const router = express.Router();

/**
 * Standardized API Response Helpers
 */
const sendSuccess = (res, data, statusCode = 200) => res.status(statusCode).json({ success: true, data, timestamp: new Date().toISOString() });
const sendError = (res, message, statusCode = 400) => res.status(statusCode).json({ success: false, error: { message }, timestamp: new Date().toISOString() });

// =============================================================================
// PUBLIC & AUTHENTICATION ENDPOINTS
// =============================================================================

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 'Vui lòng cung cấp email và password.', 400);
  }

  const user = (MEMORY_DB.users || []).find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return sendError(res, 'Thông tin đăng nhập không hợp lệ.', 401);
  }

  const tenantUsers = (MEMORY_DB.tenant_users || []).filter(tu => tu.user_id === user.id);
  const activeTenantId = tenantUsers[0]?.tenant_id || MEMORY_DB.tenants[0].id;
  const token = generateToken(user, activeTenantId, tenantUsers[0]?.role || 'TENANT_ADMIN');

  const tenant = MEMORY_DB.tenants.find(t => t.id === activeTenantId);

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name,
      isSuperAdmin: user.isSuperAdmin,
      activeTenant: tenant
    }
  });
});

// =============================================================================
// TENANT AUTHORIZED PIPELINE (ALL SECURE ENDPOINTS BELOW)
// =============================================================================
router.use(authenticate);
router.use(resolveTenantContext);

// --- TENANTS METADATA ---
router.get('/tenants', (req, res) => {
  if (req.isSuperAdmin) {
    return sendSuccess(res, { tenants: MEMORY_DB.tenants });
  }
  const userTenantIds = (MEMORY_DB.tenant_users || []).filter(tu => tu.user_id === req.user.userId).map(tu => tu.tenant_id);
  const tenants = MEMORY_DB.tenants.filter(t => userTenantIds.includes(t.id));
  return sendSuccess(res, { tenants });
});

router.get('/tenants/current', (req, res) => {
  return sendSuccess(res, { tenant: req.tenant });
});

// --- INFRASTRUCTURE (GATES, AREAS, SLOTS) ---
router.get('/gates', (req, res) => {
  const gates = (MEMORY_DB.gates || []).filter(g => g.tenant_id === req.tenantId && g.is_active !== false);
  return sendSuccess(res, { gates });
});

router.get('/parking-areas', (req, res) => {
  const areas = (MEMORY_DB.parking_areas || []).filter(a => a.tenant_id === req.tenantId && a.is_active !== false);
  return sendSuccess(res, { areas });
});

// --- TOWERS & APARTMENTS ---
router.get('/towers', (req, res) => {
  const towers = (MEMORY_DB.towers || []).filter(t => t.tenant_id === req.tenantId);
  return sendSuccess(res, { towers });
});

router.get('/apartments', (req, res) => {
  const apartments = (MEMORY_DB.apartments || []).filter(a => a.tenant_id === req.tenantId);
  return sendSuccess(res, { apartments });
});

// --- VEHICLES MODULE ---
router.get('/vehicles/search', requirePermission('vehicle.read'), (req, res) => {
  const { q = '', type = 'ALL' } = req.query;
  const term = q.toLowerCase().trim();

  const tenantVehicles = (MEMORY_DB.vehicles || []).filter(v => v.tenant_id === req.tenantId);
  if (!term) return sendSuccess(res, { vehicles: tenantVehicles });

  const filtered = tenantVehicles.filter(v => {
    const matchPlate = (v.plateNumber || v.plate_number || '').toLowerCase().includes(term);
    const matchName = (v.residentName || v.resident_name || '').toLowerCase().includes(term);
    const matchApt = (v.apartmentNumber || v.apartment_number || '').toLowerCase().includes(term);
    const matchCard = (v.cardNumber || v.card_number || '').toLowerCase().includes(term);

    if (type === 'PLATE') return matchPlate;
    if (type === 'NAME') return matchName;
    if (type === 'APARTMENT') return matchApt;
    if (type === 'CARD') return matchCard;
    return matchPlate || matchName || matchApt || matchCard;
  });

  return sendSuccess(res, { vehicles: filtered });
});

router.post('/vehicles', requirePermission('vehicle.create'), (req, res) => {
  const { plateNumber, residentName, apartmentNumber, vehicleType, cardNumber } = req.body;
  if (!plateNumber) return sendError(res, 'Biển số xe không được để trống.', 400);

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

  return sendSuccess(res, { voucher, discount, finalAmount: Number(amount) - discount });
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

// SEPAY / VIETQR BANK TRANSFER WEBHOOK ENDPOINT
router.post('/webhooks/payment/sepay', (req, res) => {
  try {
    const { id, transactionId, content, transferContent, amount, gateway = 'SEPAY' } = req.body;
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;

    const result = PaymentService.processSePayWebhook({
      tenantId,
      transactionId: id || transactionId,
      transferContent: content || transferContent || '',
      amount,
      gateway,
      rawPayload: req.body
    });

    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// --- PARKING SESSIONS (KIOSK CORE) ---
router.post('/parking/check-in', requirePermission('parking_session.checkin'), (req, res) => {
  try {
    const { plateNumber, cardNumber, gateInId, imageUrl } = req.body;
    const result = ParkingService.checkIn({
      tenantId: req.tenantId,
      plateNumber,
      cardNumber,
      gateInId,
      imageUrl
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

router.post('/parking/check-out', requirePermission('parking_session.checkout'), (req, res) => {
  try {
    const { plateNumber, cardNumber, gateOutId, imageUrl } = req.body;
    const result = ParkingService.checkOut({
      tenantId: req.tenantId,
      plateNumber,
      cardNumber,
      gateOutId,
      imageUrl
    });
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

router.get('/parking/sessions', requirePermission('parking_session.read'), (req, res) => {
  const sessions = (MEMORY_DB.parking_sessions || []).filter(s => s.tenant_id === req.tenantId);
  return sendSuccess(res, { sessions });
});

// --- REPORTS (DEBT & REVENUE BY TOWER) ---
router.get('/reports/tower', (req, res) => {
  try {
    const report = ReportService.getReportByTower(req.tenantId);
    return sendSuccess(res, report);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// --- AUTOMATED EMAIL NOTIFICATIONS ---
router.post('/notifications/remind-expiring', (req, res) => {
  try {
    const { daysThreshold = 10 } = req.body;
    const result = EmailService.scanAndSendExpiryReminders({
      tenantId: req.tenantId,
      daysThreshold: Number(daysThreshold)
    });
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// --- AUDIT LOGS ---
router.get('/audit-logs', (req, res) => {
  const logs = AuditService.getLogs(req.tenantId);
  return sendSuccess(res, { auditLogs: logs });
});

export default router;
