/**
 * Master REST API Endpoints with Multi-Tenant Security & RBAC Scoping
 */

import express from 'express';
import { authenticate, generateToken } from '../middleware/auth.js';
import { resolveTenantContext } from '../middleware/tenant-context.js';
import { requirePermission } from '../middleware/rbac.js';
import { MEMORY_DB } from '../config/database.js';
import { PaymentService } from '../services/payment.service.js';
import { ParkingService } from '../services/parking.service.js';
import { ParkingFeeService } from '../services/fee-calculator.service.js';
import { AuditService } from '../services/audit.service.js';

const router = express.Router();

// Public / Auth endpoints
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = MEMORY_DB.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Find user tenant memberships
  const tenantUsers = MEMORY_DB.tenant_users.filter(tu => tu.user_id === user.id);
  const activeTenantId = tenantUsers[0]?.tenant_id || MEMORY_DB.tenants[0].id;
  const token = generateToken(user, activeTenantId, tenantUsers[0]?.role || 'TENANT_ADMIN');

  const tenant = MEMORY_DB.tenants.find(t => t.id === activeTenantId);

  res.json({
    success: true,
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

// Middleware pipeline for all secure tenant endpoints
router.use(authenticate);
router.use(resolveTenantContext);

// --- TENANTS & METADATA ---
router.get('/tenants', (req, res) => {
  if (req.isSuperAdmin) {
    return res.json({ success: true, tenants: MEMORY_DB.tenants });
  }
  const userTenantIds = MEMORY_DB.tenant_users.filter(tu => tu.user_id === req.user.userId).map(tu => tu.tenant_id);
  const tenants = MEMORY_DB.tenants.filter(t => userTenantIds.includes(t.id));
  res.json({ success: true, tenants });
});

router.get('/tenants/current', (req, res) => {
  res.json({ success: true, tenant: req.tenant });
});

// --- TOWERS & APARTMENTS ---
router.get('/towers', (req, res) => {
  const towers = MEMORY_DB.towers.filter(t => t.tenant_id === req.tenantId);
  res.json({ success: true, towers });
});

router.get('/apartments', (req, res) => {
  const apartments = MEMORY_DB.apartments.filter(a => a.tenant_id === req.tenantId);
  res.json({ success: true, apartments });
});

// --- VEHICLES MODULE ---
router.get('/vehicles/search', requirePermission('vehicle.read'), (req, res) => {
  const { q = '', type = 'ALL' } = req.query;
  const term = q.toLowerCase().trim();

  // Scoped strictly to active tenant ID
  const tenantVehicles = MEMORY_DB.vehicles.filter(v => v.tenant_id === req.tenantId);

  if (!term) return res.json({ success: true, vehicles: tenantVehicles });

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

  res.json({ success: true, vehicles: filtered });
});

router.post('/vehicles', requirePermission('vehicle.create'), (req, res) => {
  const { plateNumber, residentName, apartmentNumber, vehicleType, cardNumber } = req.body;
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

  res.json({ success: true, vehicle });
});

// --- TARIFF RULES & VOUCHERS ---
router.get('/tariffs', (req, res) => {
  const tariffs = MEMORY_DB.tariff_rules.filter(t => t.tenant_id === req.tenantId);
  res.json({ success: true, tariffs });
});

router.get('/vouchers/validate', (req, res) => {
  const { code, amount } = req.query;
  const voucher = MEMORY_DB.vouchers.find(v => v.tenant_id === req.tenantId && v.code === code && v.is_active);

  if (!voucher) {
    return res.status(400).json({ success: false, message: 'Mã voucher không hợp lệ hoặc đã hết hạn' });
  }

  if (Number(amount) < voucher.min_order_amount) {
    return res.status(400).json({
      success: false,
      message: `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ để áp dụng mã này`
    });
  }

  let discount = voucher.discount_type === 'PERCENT' ? (Number(amount) * voucher.discount_value) / 100 : voucher.discount_value;
  discount = Math.min(discount, Number(amount));

  res.json({ success: true, voucher, discount, finalAmount: Number(amount) - discount });
});

// --- RENEWAL ORDERS & PAYMENTS ---
router.post('/orders/renewal', (req, res) => {
  try {
    const { vehicleId, durationMonths, voucherCode } = req.body;
    const result = PaymentService.createRenewalOrder({
      tenantId: req.tenantId,
      vehicleId,
      durationMonths,
      voucherCode
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// WEBHOOK ENDPOINT (VietQR / SePay Bank Webhook)
router.post('/webhooks/payment', (req, res) => {
  try {
    const { gatewayTransactionId, orderCode, amount, provider = 'VIETQR' } = req.body;
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;

    const result = PaymentService.processPaymentWebhook({
      tenantId,
      gatewayTransactionId,
      orderCode,
      amount,
      provider,
      rawPayload: req.body
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- PARKING SESSIONS ---
router.post('/parking/check-in', requirePermission('parking_session.create'), (req, res) => {
  try {
    const { plateNumber, cardNumber, gateInId, imageUrl } = req.body;
    const result = ParkingService.checkIn({
      tenantId: req.tenantId,
      plateNumber,
      cardNumber,
      gateInId,
      imageUrl
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/parking/sessions', requirePermission('parking_session.read'), (req, res) => {
  const sessions = MEMORY_DB.parking_sessions.filter(s => s.tenant_id === req.tenantId);
  res.json({ success: true, sessions });
});

// --- AUDIT LOGS ---
router.get('/audit-logs', (req, res) => {
  const logs = AuditService.getLogs(req.tenantId);
  res.json({ success: true, auditLogs: logs });
});

export default router;
