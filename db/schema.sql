-- =============================================================================
-- PARKING.GO KIOSK — MULTI-TENANT SHARED DATABASE SCHEMA & RLS POLICIES
-- PostgreSQL 13+ Compatible
-- =============================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if re-running
DROP TABLE IF EXISTS email_reminder_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS parking_sessions CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS renewal_orders CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS tenant_payment_configs CASCADE;
DROP TABLE IF EXISTS tariff_rules CASCADE;
DROP TABLE IF EXISTS parking_cards CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS towers CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- -----------------------------------------------------------------------------
-- 1. TENANTS
-- -----------------------------------------------------------------------------
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_code ON tenants(code);

-- -----------------------------------------------------------------------------
-- 2. IDENTITY & AUTHORIZATION (USERS, ROLES, PERMISSIONS, TENANT_USERS)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE, -- SUPER_ADMIN, TENANT_ADMIN, PARKING_MANAGER, GATE_OPERATOR, VIEWER
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE, -- vehicle.read, vehicle.create, payment.refund, etc.
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tenant_user UNIQUE (tenant_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 3. TOWERS & APARTMENTS (WITH CROSS-TENANT INTEGRITY CONSTRAINTS)
-- -----------------------------------------------------------------------------
CREATE TABLE towers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_towers_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT uk_towers_tenant_id_id UNIQUE (tenant_id, id) -- Required for Composite FK
);

CREATE TABLE apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tower_id UUID NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL DEFAULT 1,
    owner_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_apartments_tower_room UNIQUE (tower_id, room_number),
    CONSTRAINT uk_apartments_tenant_id_id UNIQUE (tenant_id, id), -- Required for Composite FK
    -- Enforce Cross-Tenant Integrity: Apartment tenant_id MUST EQUAL Tower tenant_id
    CONSTRAINT fk_apartments_tower_tenant FOREIGN KEY (tenant_id, tower_id) 
        REFERENCES towers(tenant_id, id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 4. RESIDENTS
-- -----------------------------------------------------------------------------
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    apartment_id UUID,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    identity_card VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_residents_tenant_id_id UNIQUE (tenant_id, id),
    -- Enforce Cross-Tenant Integrity: Resident tenant_id MUST EQUAL Apartment tenant_id
    CONSTRAINT fk_residents_apartment_tenant FOREIGN KEY (tenant_id, apartment_id) 
        REFERENCES apartments(tenant_id, id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 5. VEHICLES & PARKING CARDS
-- -----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resident_id UUID,
    plate_number VARCHAR(50) NOT NULL,
    plate_normalized VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'ELECTRIC_BIKE')),
    card_number VARCHAR(50),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING', 'EXPIRED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_vehicles_tenant_plate UNIQUE (tenant_id, plate_normalized),
    CONSTRAINT uk_vehicles_tenant_id_id UNIQUE (tenant_id, id),
    -- Enforce Cross-Tenant Integrity: Vehicle tenant_id MUST EQUAL Resident tenant_id
    CONSTRAINT fk_vehicles_resident_tenant FOREIGN KEY (tenant_id, resident_id) 
        REFERENCES residents(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE parking_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID,
    card_number VARCHAR(50) NOT NULL,
    card_type VARCHAR(30) NOT NULL DEFAULT 'RFID',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOST', 'DISABLED')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_cards_tenant_number UNIQUE (tenant_id, card_number),
    CONSTRAINT fk_cards_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 6. TARIFF RULES & PAYMENT CONFIGURATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE tariff_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'ELECTRIC_BIKE')),
    tariff_type VARCHAR(30) NOT NULL CHECK (tariff_type IN ('MONTHLY', 'CASUAL')),
    monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    base_hours INT NOT NULL DEFAULT 2,
    base_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    extra_fee_per_hour NUMERIC(12, 2) NOT NULL DEFAULT 0,
    grace_period_minutes INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tariff_tenant_type UNIQUE (tenant_id, vehicle_type, tariff_type)
);

CREATE TABLE tenant_payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'VIETQR', -- VIETQR, SEPAY, MOMO, ZALOPAY
    bank_bin VARCHAR(20) NOT NULL,
    bank_account_no VARCHAR(50) NOT NULL,
    bank_account_name VARCHAR(255) NOT NULL,
    secret_api_key VARCHAR(255),
    qr_timeout_seconds INT NOT NULL DEFAULT 120,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. VOUCHERS, RENEWAL ORDERS & PAYMENT TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
    discount_value NUMERIC(12, 2) NOT NULL,
    min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    usage_limit INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_vouchers_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE renewal_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_code VARCHAR(50) NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    plate_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL,
    duration_months INT NOT NULL DEFAULT 1,
    original_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(12, 2) NOT NULL,
    voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING_PAYMENT' CHECK (status IN ('WAITING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED')),
    paid_at TIMESTAMPTZ,
    new_expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_orders_tenant_code UNIQUE (tenant_id, order_code)
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES renewal_orders(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    idempotency_key VARCHAR(100) NOT NULL,
    raw_payload JSONB,
    webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_transactions_tenant_gateway_id UNIQUE (tenant_id, gateway_transaction_id),
    CONSTRAINT uk_transactions_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

-- -----------------------------------------------------------------------------
-- 8. PARKING SESSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE parking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_code VARCHAR(50) NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    card_number VARCHAR(50),
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_in_image_url VARCHAR(500),
    check_out_time TIMESTAMPTZ,
    check_out_image_url VARCHAR(500),
    calculated_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'EXEMPT')),
    gate_in_id VARCHAR(50),
    gate_out_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. AUDIT LOGS & REMINDER LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL DEFAULT 'EXPIRY_WARNING',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'SENT',
    error_message TEXT
);

-- =============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX idx_vehicles_tenant_plate ON vehicles (tenant_id, plate_normalized);
CREATE INDEX idx_vehicles_tenant_expiry_status ON vehicles (tenant_id, expiry_date, status);
CREATE INDEX idx_apartments_tenant_tower_room ON apartments (tenant_id, tower_id, room_number);
CREATE INDEX idx_renewal_orders_tenant_code_status ON renewal_orders (tenant_id, order_code, status);
CREATE INDEX idx_parking_sessions_tenant_plate_status ON parking_sessions (tenant_id, plate_number, payment_status);
CREATE INDEX idx_payment_tx_tenant_gateway_id ON payment_transactions (tenant_id, gateway_transaction_id);
CREATE INDEX idx_residents_tenant_phone ON residents (tenant_id, phone);
CREATE INDEX idx_parking_cards_tenant_number ON parking_cards (tenant_id, card_number);
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC);

-- =============================================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Function helper to retrieve current active tenant context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- List of tenant-specific tables to enforce RLS on:
-- towers, apartments, residents, vehicles, parking_cards, tariff_rules, tenant_payment_configs,
-- vouchers, renewal_orders, payment_transactions, parking_sessions, audit_logs, email_reminder_logs, tenant_users

-- 1. towers
ALTER TABLE towers ENABLE ROW LEVEL SECURITY;
ALTER TABLE towers FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_towers_tenant_policy ON towers
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 2. apartments
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_apartments_tenant_policy ON apartments
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 3. residents
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_residents_tenant_policy ON residents
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 4. vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicles_tenant_policy ON vehicles
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 5. parking_cards
ALTER TABLE parking_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_cards FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_cards_tenant_policy ON parking_cards
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 6. tariff_rules
ALTER TABLE tariff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_rules FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tariff_rules_tenant_policy ON tariff_rules
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 7. tenant_payment_configs
ALTER TABLE tenant_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payment_configs FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tenant_payment_configs_tenant_policy ON tenant_payment_configs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 8. vouchers
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vouchers_tenant_policy ON vouchers
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 9. renewal_orders
ALTER TABLE renewal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_orders FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_renewal_orders_tenant_policy ON renewal_orders
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 10. payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_payment_transactions_tenant_policy ON payment_transactions
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 11. parking_sessions
ALTER TABLE parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_sessions_tenant_policy ON parking_sessions
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 12. audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_audit_logs_tenant_policy ON audit_logs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 13. email_reminder_logs
ALTER TABLE email_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reminder_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_email_reminder_logs_tenant_policy ON email_reminder_logs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

-- 14. tenant_users
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tenant_users_tenant_policy ON tenant_users
    FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');
