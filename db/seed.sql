-- =============================================================================
-- PARKING.GO KIOSK — MULTI-TENANT SEED DATA
-- =============================================================================

-- Disable RLS bypass for seeding by setting super admin flag
SET app.is_super_admin = 'true';

-- 1. SEED ROLES
INSERT INTO roles (id, code, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Super Administrator', 'Full access to all system tenants and platform settings'),
('00000000-0000-0000-0000-000000000002', 'TENANT_ADMIN', 'Tenant Administrator', 'Administrative control over a specific tenant environment'),
('00000000-0000-0000-0000-000000000003', 'PARKING_MANAGER', 'Parking Manager', 'Manages parking operations, tariffs, and monthly subscriptions'),
('00000000-0000-0000-0000-000000000004', 'GATE_OPERATOR', 'Gate Operator', 'Monitors gate check-ins and check-outs'),
('00000000-0000-0000-0000-000000000005', 'VIEWER', 'Viewer / Auditor', 'Read-only access to parking operations');

-- 2. SEED PERMISSIONS
INSERT INTO permissions (id, code, module, description) VALUES
(gen_random_uuid(), 'vehicle.read', 'vehicle', 'View vehicles'),
(gen_random_uuid(), 'vehicle.create', 'vehicle', 'Register new vehicle'),
(gen_random_uuid(), 'vehicle.update', 'vehicle', 'Update vehicle details'),
(gen_random_uuid(), 'vehicle.delete', 'vehicle', 'Delete vehicle record'),
(gen_random_uuid(), 'parking_session.read', 'parking', 'View parking sessions'),
(gen_random_uuid(), 'parking_session.create', 'parking', 'Check-in vehicle'),
(gen_random_uuid(), 'parking_session.checkout', 'parking', 'Check-out vehicle'),
(gen_random_uuid(), 'payment.read', 'payment', 'View payments & orders'),
(gen_random_uuid(), 'payment.refund', 'payment', 'Refund payment transaction'),
(gen_random_uuid(), 'tariff.read', 'tariff', 'View tariff rules'),
(gen_random_uuid(), 'tariff.update', 'tariff', 'Update tariff rules'),
(gen_random_uuid(), 'voucher.read', 'voucher', 'View vouchers'),
(gen_random_uuid(), 'voucher.create', 'voucher', 'Create voucher'),
(gen_random_uuid(), 'voucher.update', 'voucher', 'Update voucher'),
(gen_random_uuid(), 'user.manage', 'user', 'Manage tenant users'),
(gen_random_uuid(), 'tenant.manage', 'tenant', 'Manage tenant settings');

-- 3. SEED TENANTS
-- Tenant A: Vinhomes Ocean Park
-- Tenant B: Masteri Waterfront
INSERT INTO tenants (id, code, name, domain, contact_email, contact_phone, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'VINHOMES_OCEAN', 'Vinhomes Ocean Park', 'vinhomes.kiosk.com', 'admin@vinhomes.vn', '1900232389', true),
('22222222-2222-2222-2222-222222222222', 'MASTERI_WATERFRONT', 'Masteri Waterfront', 'masteri.kiosk.com', 'admin@masteri.vn', '18006868', true);

-- 4. SEED USERS
-- Password for demo users: "Password123!" (hashed with bcrypt cost 10)
INSERT INTO users (id, email, password_hash, full_name, phone, is_super_admin) VALUES
('a0000000-0000-0000-0000-000000000000', 'superadmin@parking.go', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQOEg6Lruj3vjPGga31lW', 'System Administrator', '0901000000', true),
('a1111111-1111-1111-1111-111111111111', 'admin@vinhomes.vn', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQOEg6Lruj3vjPGga31lW', 'Nguyễn Quản Lý (Vinhomes)', '0901111111', false),
('a2222222-2222-2222-2222-222222222222', 'admin@masteri.vn', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQOEg6Lruj3vjPGga31lW', 'Trần Quản Lý (Masteri)', '0902222222', false);

-- Assign Tenant Users
INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES
('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002'), -- Tenant Admin Vinhomes
('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002'); -- Tenant Admin Masteri

-- 5. SEED TOWERS
-- Vinhomes Towers: A1, A2, A3
-- Masteri Towers: M1, M2
INSERT INTO towers (id, tenant_id, code, name, description) VALUES
('t1111111-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'A1', 'Tháp A1 - Sapphire 1', 'Tòa nhà căn hộ cao cấp A1'),
('t1111111-0000-0000-0000-0000000000a2', '11111111-1111-1111-1111-111111111111', 'A2', 'Tháp A2 - Sapphire 2', 'Tòa nhà căn hộ cao cấp A2'),
('t1111111-0000-0000-0000-0000000000a3', '11111111-1111-1111-1111-111111111111', 'A3', 'Tháp A3 - Sapphire 3', 'Tòa nhà căn hộ cao cấp A3'),

('t2222222-0000-0000-0000-0000000000m1', '22222222-2222-2222-2222-222222222222', 'M1', 'Tháp M1 - Miami', 'Tòa tháp ven hồ M1'),
('t2222222-0000-0000-0000-0000000000m2', '22222222-2222-2222-2222-222222222222', 'M2', 'Tháp M2 - Hawaii', 'Tòa tháp cao cấp M2');

-- 6. SEED APARTMENTS
INSERT INTO apartments (id, tenant_id, tower_id, room_number, floor_number, owner_name) VALUES
('apt11111-0000-0000-0000-000000001205', '11111111-1111-1111-1111-111111111111', 't1111111-0000-0000-0000-0000000000a1', 'A1-1205', 12, 'Trần Văn Tuấn'),
('apt11111-0000-0000-0000-000000000806', '11111111-1111-1111-1111-111111111111', 't1111111-0000-0000-0000-0000000000a2', 'A2-0806', 8, 'Nguyễn Thị Hằng'),
('apt11111-0000-0000-0000-000000000912', '11111111-1111-1111-1111-111111111111', 't1111111-0000-0000-0000-0000000000a1', 'A1-0912', 9, 'Lê Văn Nam'),

('apt22222-0000-0000-0000-000000000501', '22222222-2222-2222-2222-222222222222', 't2222222-0000-0000-0000-0000000000m1', 'M1-0501', 5, 'Phạm Hoàng Minh'),
('apt22222-0000-0000-0000-000000001802', '22222222-2222-2222-2222-222222222222', 't2222222-0000-0000-0000-0000000000m2', 'M2-1802', 18, 'Đặng Mai Phương');

-- 7. SEED RESIDENTS
INSERT INTO residents (id, tenant_id, apartment_id, full_name, phone, email, identity_card) VALUES
('r1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'apt11111-0000-0000-0000-000000001205', 'Trần Văn Tuấn', '0912345678', 'tuan.tv@gmail.com', '001092001122'),
('r1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'apt11111-0000-0000-0000-000000000806', 'Nguyễn Thị Hằng', '0987654321', 'hang.nt@gmail.com', '001092003344'),

('r2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'apt22222-0000-0000-0000-000000000501', 'Phạm Hoàng Minh', '0933445566', 'minh.ph@gmail.com', '001092005566');

-- 8. SEED VEHICLES
INSERT INTO vehicles (id, tenant_id, resident_id, plate_number, plate_normalized, vehicle_type, card_number, start_date, expiry_date, status) VALUES
('v1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'r1111111-0000-0000-0000-000000000001', '30F-123.45', '30F12345', 'CAR', 'CARD-8831', '2024-01-01', '2026-08-30', 'ACTIVE'),
('v1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'r1111111-0000-0000-0000-000000000002', '30A-789.10', '30A78910', 'CAR', 'CARD-8832', '2024-01-01', '2026-08-10', 'EXPIRING'),
('v1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'r1111111-0000-0000-0000-000000000001', '51H-222.22', '51H22222', 'MOTORBIKE', 'CARD-8833', '2024-01-01', '2026-07-28', 'EXPIRED'),

('v2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'r2222222-0000-0000-0000-000000000001', '29A-999.88', '29A99988', 'CAR', 'CARD-9901', '2024-01-01', '2026-09-15', 'ACTIVE');

-- 9. SEED PARKING CARDS
INSERT INTO parking_cards (id, tenant_id, vehicle_id, card_number, card_type, status) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'v1111111-0000-0000-0000-000000000001', 'CARD-8831', 'RFID', 'ACTIVE'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'v1111111-0000-0000-0000-000000000002', 'CARD-8832', 'RFID', 'ACTIVE'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'v1111111-0000-0000-0000-000000000003', 'CARD-8833', 'RFID', 'ACTIVE'),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'v2222222-0000-0000-0000-000000000001', 'CARD-9901', 'RFID', 'ACTIVE');

-- 10. SEED TARIFF RULES
INSERT INTO tariff_rules (tenant_id, vehicle_type, tariff_type, monthly_fee, base_hours, base_fee, extra_fee_per_hour, grace_period_minutes) VALUES
-- Vinhomes Ocean Park Tariffs
('11111111-1111-1111-1111-111111111111', 'CAR', 'MONTHLY', 1250000, 0, 0, 0, 15),
('11111111-1111-1111-1111-111111111111', 'MOTORBIKE', 'MONTHLY', 120000, 0, 0, 0, 15),
('11111111-1111-1111-1111-111111111111', 'ELECTRIC_BIKE', 'MONTHLY', 80000, 0, 0, 0, 15),
('11111111-1111-1111-1111-111111111111', 'CAR', 'CASUAL', 0, 2, 25000, 10000, 15),
('11111111-1111-1111-1111-111111111111', 'MOTORBIKE', 'CASUAL', 0, 2, 5000, 3000, 15),

-- Masteri Waterfront Tariffs
('22222222-2222-2222-2222-222222222222', 'CAR', 'MONTHLY', 1500000, 0, 0, 0, 15),
('22222222-2222-2222-2222-222222222222', 'MOTORBIKE', 'MONTHLY', 150000, 0, 0, 0, 15),
('22222222-2222-2222-2222-222222222222', 'CAR', 'CASUAL', 0, 2, 30000, 15000, 15);

-- 11. SEED PAYMENT CONFIGURATIONS
INSERT INTO tenant_payment_configs (tenant_id, provider, bank_bin, bank_account_no, bank_account_name, secret_api_key, qr_timeout_seconds) VALUES
('11111111-1111-1111-1111-111111111111', 'VIETQR', '970422', '110022334455', 'BQL CHUNG CU VINHOMES OCEAN PARK', 'vh_secret_key_8899', 120),
('22222222-2222-2222-2222-222222222222', 'VIETQR', '970415', '998877665544', 'BQL MASTERI WATERFRONT', 'mw_secret_key_1122', 120);

-- 12. SEED VOUCHERS
INSERT INTO vouchers (tenant_id, code, discount_type, discount_value, min_order_amount, valid_from, valid_to, usage_limit) VALUES
('11111111-1111-1111-1111-111111111111', 'HE2024', 'PERCENT', 10, 100000, '2024-01-01', '2026-12-31', 500),
('11111111-1111-1111-1111-111111111111', 'TRIAN100K', 'FIXED', 100000, 500000, '2024-01-01', '2026-12-31', 200),
('22222222-2222-2222-2222-222222222222', 'MASTERI15', 'PERCENT', 15, 200000, '2024-01-01', '2026-12-31', 300);

RESET app.is_super_admin;
