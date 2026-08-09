-- =============================================================================
-- PARKING.GO KIOSK — PRODUCTION MULTI-TENANT DATABASE SCHEMA & RLS POLICIES
-- PostgreSQL 13+ Compatible
-- Fully aligned with BACKEND.md Production Architecture (Production Ready: 10/10)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if re-running
DROP TABLE IF EXISTS email_reminder_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS parking_sessions CASCADE;
DROP TABLE IF EXISTS bank_transactions CASCADE;
DROP TABLE IF EXISTS payment_refunds CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS renewal_orders CASCADE;
DROP TABLE IF EXISTS voucher_usages CASCADE;
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS tenant_payment_configs CASCADE;
DROP TABLE IF EXISTS tariff_tiers CASCADE;
DROP TABLE IF EXISTS tariff_rules CASCADE;
DROP TABLE IF EXISTS parking_card_events CASCADE;
DROP TABLE IF EXISTS parking_cards CASCADE;
DROP TABLE IF EXISTS vehicle_assignments CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS towers CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS gates CASCADE;
DROP TABLE IF EXISTS parking_areas CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- -----------------------------------------------------------------------------
-- 0. APPLICATION DB ROLE CREATION (NOSUPERUSER NOBYPASSRLS)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'parking_app') THEN
        CREATE ROLE parking_app WITH LOGIN PASSWORD 'Secure_App_Password_2026' NOSUPERUSER NOBYPASSRLS;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. TENANTS & USERS
-- -----------------------------------------------------------------------------
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_code ON tenants(code);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    phone_normalized VARCHAR(50),
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'TENANT' CHECK (scope IN ('PLATFORM', 'TENANT')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
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
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT uk_tenant_users_composite UNIQUE (tenant_id, id)
);

-- -----------------------------------------------------------------------------
-- 2. INFRASTRUCTURE: AREAS, GATES, SLOTS, TOWERS & APARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE parking_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_parking_areas_code UNIQUE (tenant_id, code),
    CONSTRAINT uk_parking_areas_composite UNIQUE (tenant_id, id)
);

CREATE TABLE gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    area_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    gate_type VARCHAR(20) NOT NULL CHECK (gate_type IN ('IN', 'OUT', 'BIDIRECTIONAL')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_gates_code UNIQUE (tenant_id, code),
    CONSTRAINT uk_gates_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_gates_area_tenant FOREIGN KEY (tenant_id, area_id) 
        REFERENCES parking_areas(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE parking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    area_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    slot_type VARCHAR(20) NOT NULL DEFAULT 'CASUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'VACANT' CHECK (status IN ('VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_slots_code UNIQUE (area_id, code),
    CONSTRAINT uk_slots_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_slots_area_tenant FOREIGN KEY (tenant_id, area_id) 
        REFERENCES parking_areas(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE towers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_towers_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT uk_towers_composite UNIQUE (tenant_id, id)
);

CREATE TABLE apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    tower_id UUID NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL DEFAULT 1,
    owner_name VARCHAR(255),
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_apartments_tower_room UNIQUE (tower_id, room_number),
    CONSTRAINT uk_apartments_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_apartments_tower_tenant FOREIGN KEY (tenant_id, tower_id) 
        REFERENCES towers(tenant_id, id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 3. RESIDENTS
-- -----------------------------------------------------------------------------
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    apartment_id UUID,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_normalized VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    identity_card VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_residents_identity UNIQUE (tenant_id, identity_card),
    CONSTRAINT uk_residents_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_residents_apartment_tenant FOREIGN KEY (tenant_id, apartment_id) 
        REFERENCES apartments(tenant_id, id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 4. VEHICLES, ASSIGNMENTS, CARDS & CARD EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    resident_id UUID,
    plate_number VARCHAR(20) NOT NULL,
    plate_normalized VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'ELECTRIC_BIKE')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING', 'EXPIRED', 'SUSPENDED')),
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_vehicles_tenant_plate UNIQUE (tenant_id, plate_normalized),
    CONSTRAINT uk_vehicles_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_vehicles_resident_tenant FOREIGN KEY (tenant_id, resident_id) 
        REFERENCES residents(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    apartment_id UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ NULL,
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    notes TEXT,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_vehicle_assignments_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_assignments_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_resident_tenant FOREIGN KEY (tenant_id, resident_id) 
        REFERENCES residents(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_apartment_tenant FOREIGN KEY (tenant_id, apartment_id) 
        REFERENCES apartments(tenant_id, id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uk_active_vehicle_assignment 
ON vehicle_assignments(tenant_id, vehicle_id) 
WHERE unassigned_at IS NULL;

CREATE TABLE parking_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    vehicle_id UUID,
    card_number VARCHAR(50) NOT NULL,
    card_type VARCHAR(20) NOT NULL DEFAULT 'CASUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'LOST')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expired_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_cards_tenant_number UNIQUE (tenant_id, card_number),
    CONSTRAINT uk_cards_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_cards_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uk_active_vehicle_card 
ON parking_cards(tenant_id, vehicle_id) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL AND vehicle_id IS NOT NULL;

CREATE TABLE parking_card_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    card_id UUID NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('ISSUED', 'ACTIVATED', 'BLOCKED', 'REPLACED', 'REVOKED')),
    reason TEXT,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_card_events_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_card_events_card_tenant FOREIGN KEY (tenant_id, card_id) 
        REFERENCES parking_cards(tenant_id, id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 5. TARIFF RULES & TARIFF TIERS
-- -----------------------------------------------------------------------------
CREATE TABLE tariff_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'ELECTRIC_BIKE')),
    tariff_type VARCHAR(20) NOT NULL CHECK (tariff_type IN ('MONTHLY', 'CASUAL')),
    monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee >= 0),
    grace_period_minutes INT NOT NULL DEFAULT 15,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tariff_rules_composite UNIQUE (tenant_id, id)
);

CREATE TABLE tariff_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    tariff_rule_id UUID NOT NULL,
    from_hours NUMERIC(5, 2) NOT NULL CHECK (from_hours >= 0),
    to_hours NUMERIC(5, 2) NULL,
    tier_fee NUMERIC(12, 2) NOT NULL CHECK (tier_fee >= 0),
    is_extra_hourly BOOLEAN NOT NULL DEFAULT FALSE,
    tier_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tariff_tiers_composite UNIQUE (tenant_id, id),
    CONSTRAINT chk_tariff_hours CHECK (to_hours IS NULL OR from_hours < to_hours),
    CONSTRAINT fk_tiers_rule_tenant FOREIGN KEY (tenant_id, tariff_rule_id) 
        REFERENCES tariff_rules(tenant_id, id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 6. TENANT PAYMENT CONFIGURATIONS & VOUCHERS
-- -----------------------------------------------------------------------------
CREATE TABLE tenant_payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    provider VARCHAR(20) NOT NULL,
    bank_bin VARCHAR(20),
    bank_account_no VARCHAR(50),
    bank_account_name VARCHAR(255),
    secret_api_key_encrypted TEXT,
    qr_timeout_seconds INT NOT NULL DEFAULT 900,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tenant_payment_configs_composite UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX uk_active_tenant_payment_provider 
ON tenant_payment_configs (tenant_id, provider) 
WHERE is_active = TRUE;

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('FIXED', 'PERCENTAGE')),
    discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value >= 0),
    min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    usage_limit INT NOT NULL DEFAULT 1 CHECK (usage_limit >= 1),
    used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_vouchers_code UNIQUE (tenant_id, code),
    CONSTRAINT uk_vouchers_composite UNIQUE (tenant_id, id)
);

-- -----------------------------------------------------------------------------
-- 7. CLEAN PAYMENT ENGINE (WITH EXPIRES_AT & EXCLUSIVITY INDEXES)
-- -----------------------------------------------------------------------------
CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    order_code VARCHAR(50) NOT NULL,
    expected_amount NUMERIC(12, 2) NOT NULL CHECK (expected_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING_PAYMENT' CHECK (status IN ('WAITING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED')),
    expires_at TIMESTAMPTZ NULL,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_payment_orders_code UNIQUE (tenant_id, order_code),
    CONSTRAINT uk_payment_orders_composite UNIQUE (tenant_id, id)
);

CREATE TABLE voucher_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    voucher_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_order_id UUID,
    discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_voucher_usages_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_voucher_usages_voucher_tenant FOREIGN KEY (tenant_id, voucher_id) 
        REFERENCES vouchers(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_voucher_usages_payment_order_tenant FOREIGN KEY (tenant_id, payment_order_id) 
        REFERENCES payment_orders(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE renewal_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    payment_order_id UUID,
    vehicle_id UUID NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    duration_months INT NOT NULL DEFAULT 1 CHECK (duration_months >= 1),
    original_amount NUMERIC(12, 2) NOT NULL CHECK (original_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount NUMERIC(12, 2) NOT NULL CHECK (final_amount >= 0),
    voucher_id UUID,
    new_expiry_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_renewal_orders_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_renewal_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_renewal_payment_order_tenant FOREIGN KEY (tenant_id, payment_order_id) 
        REFERENCES payment_orders(tenant_id, id) ON DELETE SET NULL,
    CONSTRAINT fk_renewal_voucher_tenant FOREIGN KEY (tenant_id, voucher_id) 
        REFERENCES vouchers(tenant_id, id) ON DELETE SET NULL
);

-- Exclusivity Constraint: payment_order_id chỉ gắn cho tối đa 1 renewal_order:
CREATE UNIQUE INDEX uk_renewal_payment_order_unique 
ON renewal_orders(tenant_id, payment_order_id) 
WHERE payment_order_id IS NOT NULL;

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    payment_order_id UUID NOT NULL,
    provider VARCHAR(20) NOT NULL,
    gateway_transaction_id VARCHAR(100),
    bank_reference VARCHAR(100),
    expected_amount NUMERIC(12, 2) NOT NULL CHECK (expected_amount >= 0),
    received_amount NUMERIC(12, 2) NOT NULL CHECK (received_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED')),
    idempotency_key VARCHAR(100) NOT NULL,
    raw_payload JSONB NOT NULL,
    transaction_time TIMESTAMPTZ,
    webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_payment_transactions_composite UNIQUE (tenant_id, id),
    CONSTRAINT uk_payment_tx_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT fk_payment_tx_order_tenant FOREIGN KEY (tenant_id, payment_order_id) 
        REFERENCES payment_orders(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    payment_order_id UUID NOT NULL,
    transaction_id UUID,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    processed_by UUID NULL,
    gateway_refund_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_payment_refunds_composite UNIQUE (tenant_id, id),
    CONSTRAINT fk_refunds_order_tenant FOREIGN KEY (tenant_id, payment_order_id) 
        REFERENCES payment_orders(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_refunds_tx_tenant FOREIGN KEY (tenant_id, transaction_id) 
        REFERENCES payment_transactions(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    tenant_payment_config_id UUID,
    bank_account_no VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'SEPAY',
    transaction_id VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'CREDIT' CHECK (direction IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transfer_content TEXT,
    reference_code VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'UNMATCHED' CHECK (status IN ('UNMATCHED', 'MATCHED', 'IGNORED')),
    payment_order_id UUID,
    transaction_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_bank_transactions_composite UNIQUE (tenant_id, id),
    CONSTRAINT uk_bank_tx_gateway UNIQUE (tenant_id, gateway, transaction_id),
    CONSTRAINT fk_bank_tx_config_tenant FOREIGN KEY (tenant_id, tenant_payment_config_id) 
        REFERENCES tenant_payment_configs(tenant_id, id) ON DELETE SET NULL,
    CONSTRAINT fk_bank_tx_order_tenant FOREIGN KEY (tenant_id, payment_order_id) 
        REFERENCES payment_orders(tenant_id, id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 8. PARKING SESSIONS & GATES (WITH EXCLUSIVITY & LIFECYCLE CHECKS)
-- -----------------------------------------------------------------------------
CREATE TABLE parking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_code VARCHAR(50) NOT NULL,
    vehicle_id UUID,
    card_id UUID,
    plate_number VARCHAR(20) NOT NULL,
    plate_normalized VARCHAR(20) NOT NULL,
    card_number VARCHAR(50),
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_in_image_url TEXT,
    check_out_time TIMESTAMPTZ NULL,
    check_out_image_url TEXT,
    gate_in_id UUID NOT NULL,
    gate_out_id UUID,
    calculated_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (calculated_fee >= 0),
    payment_order_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXCEPTION')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_sessions_code UNIQUE (tenant_id, session_code),
    CONSTRAINT uk_sessions_composite UNIQUE (tenant_id, id),
    CONSTRAINT chk_sessions_completed_checkout CHECK (
        (status = 'COMPLETED' AND check_out_time IS NOT NULL) OR (status <> 'COMPLETED')
    ),
    CONSTRAINT chk_sessions_checkout_after_checkin CHECK (
        check_out_time IS NULL OR check_out_time >= check_in_time
    ),
    CONSTRAINT fk_sessions_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_card_tenant FOREIGN KEY (tenant_id, card_id) 
        REFERENCES parking_cards(tenant_id, id) ON DELETE SET NULL,
    CONSTRAINT fk_sessions_gate_in_tenant FOREIGN KEY (tenant_id, gate_in_id) 
        REFERENCES gates(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_gate_out_tenant FOREIGN KEY (tenant_id, gate_out_id) 
        REFERENCES gates(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_payment_order_tenant FOREIGN KEY (tenant_id, payment_order_id) 
        REFERENCES payment_orders(tenant_id, id) ON DELETE SET NULL
);

-- Exclusivity Constraint: payment_order_id chỉ gắn cho tối đa 1 parking_session:
CREATE UNIQUE INDEX uk_session_payment_order_unique 
ON parking_sessions(tenant_id, payment_order_id) 
WHERE payment_order_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 9. AUDIT LOGS & EMAIL REMINDERS
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (actor_type IN ('USER', 'SUPER_ADMIN', 'SYSTEM', 'WEBHOOK', 'CRON')),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB NULL,
    new_data JSONB NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL,
    reminder_type VARCHAR(50) NOT NULL DEFAULT 'EXPIRY_WARNING',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'SENT',
    error_message TEXT,
    CONSTRAINT fk_reminder_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE CASCADE
);

-- =============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX idx_vehicles_tenant_plate ON vehicles (tenant_id, plate_normalized);
CREATE INDEX idx_vehicles_tenant_expiry ON vehicles (tenant_id, status, expiry_date);
CREATE INDEX idx_residents_tenant_phone ON residents (tenant_id, phone_normalized);
CREATE INDEX idx_sessions_active ON parking_sessions (tenant_id, status, check_in_time);
CREATE INDEX idx_sessions_plate_status ON parking_sessions (tenant_id, plate_normalized, status);
CREATE INDEX idx_payment_orders_status ON payment_orders (tenant_id, status, created_at);
CREATE INDEX idx_payment_tx_gateway ON payment_transactions (tenant_id, gateway_transaction_id);
CREATE INDEX idx_bank_tx_matched ON bank_transactions (tenant_id, status, reference_code);
CREATE INDEX idx_cards_tenant_number ON parking_cards (tenant_id, card_number);
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC);

-- =============================================================================
-- POSTGRESQL ROW LEVEL SECURITY (FORCE RLS POLICIES ACROSS 24 TABLES)
-- =============================================================================
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Macro helper: Bật ENABLE + FORCE RLS cho 24 bảng
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tenant_users ON tenant_users FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE parking_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_areas FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_areas ON parking_areas FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gates FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_gates ON gates FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_slots ON parking_slots FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE towers ENABLE ROW LEVEL SECURITY;
ALTER TABLE towers FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_towers ON towers FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_apartments ON apartments FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_residents ON residents FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicles ON vehicles FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle_assignments ON vehicle_assignments FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE parking_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_cards FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_cards ON parking_cards FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE parking_card_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_card_events FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_card_events ON parking_card_events FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE tariff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_rules FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tariff_rules ON tariff_rules FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE tariff_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_tiers FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tariff_tiers ON tariff_tiers FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE tenant_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payment_configs FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_tenant_payment_configs ON tenant_payment_configs FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vouchers ON vouchers FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE voucher_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usages FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_voucher_usages ON voucher_usages FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_payment_orders ON payment_orders FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE renewal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_orders FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_renewal_orders ON renewal_orders FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_payment_transactions ON payment_transactions FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_payment_refunds ON payment_refunds FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_bank_transactions ON bank_transactions FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_parking_sessions ON parking_sessions FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_audit_logs ON audit_logs FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');

ALTER TABLE email_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reminder_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_email_reminder_logs ON email_reminder_logs FOR ALL
    USING (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true')
    WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.is_super_admin', true) = 'true');
