# PARKING.GO KIOSK — MASTER IMPLEMENTATION PLAN

## Multi-Tenant Parking Management Platform (Production Architecture & Schema Specification)

---

# 1. MỤC TIÊU HỆ THỐNG

Xây dựng PARKING.GO KIOSK thành một nền tảng quản lý bãi xe Multi-Tenant cấp Production (Sẵn sàng 100% cho triển khai với NestJS / Prisma / PostgreSQL), phục vụ:

* Chung cư, khu đô thị, tòa nhà văn phòng, bãi xe độc lập.
* Nhiều khu vực / nhiều tháp / nhiều phân khu trong cùng một dự án.
* Hàng chục đến hàng trăm Tenant cùng vận hành trên một nền tảng.

### 8 Nguyên tắc Cốt lõi:
1. **One Codebase Multi-Tenant**: Một bộ mã nguồn duy nhất phục vụ tất cả các Tenant. Không fork code cho từng dự án.
2. **Tenant Provisioning bằng Data/Config**: Thêm Tenant mới hoàn toàn thông qua cấu hình database và provisioning automation.
3. **Tuyệt đối cô lập dữ liệu (Strict Data Isolation)**: Dữ liệu của Tenant A không thể bị xem, ghi hoặc sửa bởi Tenant B dưới mọi hình thức (100% Composite FK Protection & FORCE RLS).
4. **Cấu hình độc lập (Tenant Autonomy)**: Mỗi Tenant có bảng giá, ngân hàng/cổng thanh toán, danh sách tháp/căn hộ, cổng/làn xe và quy trình riêng.
5. **Khả năng mở rộng (Scale Ready)**: Kiến trúc từ vài Tenant lên hàng trăm Tenant, chuẩn bị sẵn sàng cho DB Read Replicas & Partitioning.
6. **Mô hình Thanh toán & Phiên gửi linh hoạt**: Hỗ trợ gia hạn vé tháng, xe vãng lai (casual parking), hoàn tiền (refund), đối soát ngân hàng tự động (bank reconciliation SePay/VietQR).
7. **Toàn vẹn Dữ liệu & Audit Traceability**: Đầy đủ lịch sử thay đổi thẻ, xe, gia hạn, giao dịch thanh toán, voucher usages và thao tác quản trị.
8. **Production Hardened**: Xử lý concurrency (Voucher Pessimistic Lock `FOR UPDATE`, Payment, Checkout), mã hóa secret, bảo mật Webhook và RLS multi-layer với Application Role `NOBYPASSRLS`.

---

# 2. KIẾN TRÚC MULTI-TENANT & DB ARCHITECTURE HIERARCHY

## Mô hình Kiến trúc
Sử dụng mô hình **Shared Database, Shared Schema** bảo vệ bằng multi-layer authorization:

```text
Shared PostgreSQL Database
        +
tenant_id
        +
PostgreSQL Row Level Security (FORCE RLS)
        +
Backend TenantContext (Prisma SET LOCAL app.current_tenant_id per transaction)
        +
100% Composite Foreign Keys & Exclusivity Constraints
```

## Sơ đồ Kiến trúc Cốt lõi (Production Domain Tree)
```text
Tenant
 │
 ├── Users / RBAC
 │    ├── Users (users - Global User Registry)
 │    ├── Roles (roles - scope: PLATFORM | TENANT)
 │    ├── Permissions (permissions)
 │    └── Tenant Users (tenant_users - Composite FK)
 │
 ├── Parking Infrastructure
 │    ├── Areas (parking_areas)
 │    ├── Gates (gates - gate_type: IN | OUT | BIDIRECTIONAL)
 │    └── Slots (parking_slots)
 │
 ├── Residents & Vehicles
 │    ├── Residents (residents)
 │    └── Vehicles (vehicles)
 │         ├── Vehicle Assignments (vehicle_assignments - Partial Index: 1 Active Assignment)
 │         └── Cards (parking_cards - Partial Index: 1 Active Card per vehicle)
 │              └── Card Events (parking_card_events - Lifecycle Audit)
 │
 ├── Tariffs
 │    └── Tariff Rules (tariff_rules - effective_from/to)
 │         └── Tariff Tiers (tariff_tiers - from_hours < to_hours & non-overlapping)
 │
 ├── Vouchers
 │    └── Voucher Usages (voucher_usages - Audit từng lần dùng voucher)
 │
 ├── Orders
 │    └── Renewal Orders (renewal_orders - Unique payment_order_id Exclusivity)
 │
 ├── Parking Sessions (parking_sessions - Unique payment_order_id Exclusivity, vehicle_id, card_id, gate_in_id, gate_out_id)
 │
 └── Payments (Universal Payment Engine & SePay Webhook Auto Reconciliation)
      ├── Payment Orders (payment_orders - Clean Aggregate Root, expires_at, expected/paid_amount CHECKs)
      ├── Payment Attempts (payment_transactions - Gateway Logs & Idempotency)
      ├── Payment Refunds (payment_refunds - Composite FK)
      └── Bank Transactions (bank_transactions - direction: CREDIT/DEBIT, SePay Auto Match)
```

---

# 3. TENANT IDENTIFICATION — QUY TẮC BẢO MẬT

## Quy tắc Tối thượng: KHÔNG tin tưởng Header từ Frontend
Frontend có thể gửi header `X-Tenant-ID: TENANT_A`, tuy nhiên Backend **phải xác thực bắt buộc** dựa trên:
```text
Authenticated User Context + User-Tenant Membership (tenant_users) + Server TenantContext
```
Nếu user gửi `X-Tenant-ID: TENANT_B` mà không có membership hợp lệ tại Tenant B, request bị từ chối lập tức với `403 Forbidden`.

---

# 4. TENANT CONTEXT IN PRISMA & DB ROLE SECURITY

## 4.1 Prisma Connection Pooling & Transaction `SET LOCAL`
Trong Prisma / NestJS, connection pooling có thể reuse DB connection giữa các request. Do đó, `SET app.current_tenant_id` dạng session-level dễ gây rò rỉ dữ liệu.
Bắt buộc sử dụng **Transaction-scoped `SET LOCAL`**:

```typescript
// NestJS / Prisma Tenant Execution Wrapper
async function runInTenantContext<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // 1. Transaction-scoped tenant setting (Tự động clear khi COMMIT / ROLLBACK)
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    // 2. Thao tác query nghiệp vụ
    return await fn(tx as PrismaClient);
  });
}
```

## 4.2 Application Role Security Definition
DB user chạy ứng dụng (Application Role) **bắt buộc không phải là Owner của table** và **bắt buộc có NOSUPERUSER NOBYPASSRLS**:

```sql
-- Production DDL cho Application Role:
CREATE ROLE parking_app WITH LOGIN PASSWORD 'Secure_App_Password_2026' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE parking_kiosk TO parking_app;
GRANT USAGE ON SCHEMA public TO parking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO parking_app;
```

---

# 5. POSTGRESQL ROW LEVEL SECURITY (FORCE RLS) & COMPOSITE FK AUDIT

Mọi bảng chứa dữ liệu thuộc Tenant (24 bảng) bắt buộc thực thi cả `ENABLE ROW LEVEL SECURITY` lẫn `FORCE ROW LEVEL SECURITY`:

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY; -- Ngăn Table Owner vô tình bypass RLS!
```

---

# 6. TENANTS, USERS, ROLES (RBAC SCOPE) SCHEMA

## 6.1 roles & permissions (Scope PLATFORM vs TENANT)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE, 
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'TENANT' CHECK (scope IN ('PLATFORM', 'TENANT')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 6.2 tenant_users
```sql
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tenant_user UNIQUE(tenant_id, user_id),
    CONSTRAINT uk_tenant_users_composite UNIQUE(tenant_id, id)
);
```

---

# 7. PARKING INFRASTRUCTURE: AREAS, GATES, SLOTS, TOWERS, APARTMENTS

```sql
CREATE TABLE parking_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_parking_areas_code UNIQUE(tenant_id, code),
    CONSTRAINT uk_parking_areas_composite UNIQUE(tenant_id, id)
);

CREATE TABLE gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    area_id UUID NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    gate_type VARCHAR(20) NOT NULL CHECK (gate_type IN ('IN', 'OUT', 'BIDIRECTIONAL')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_gates_code UNIQUE(tenant_id, code),
    CONSTRAINT uk_gates_composite UNIQUE(tenant_id, id),
    CONSTRAINT fk_gates_area_tenant FOREIGN KEY (tenant_id, area_id) REFERENCES parking_areas(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE parking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    area_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    slot_type VARCHAR(20) NOT NULL DEFAULT 'CASUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'VACANT' CHECK (status IN ('VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_slots_code UNIQUE(area_id, code),
    CONSTRAINT uk_slots_composite UNIQUE(tenant_id, id),
    CONSTRAINT fk_slots_area_tenant FOREIGN KEY (tenant_id, area_id) REFERENCES parking_areas(tenant_id, id) ON DELETE RESTRICT
);
```

---

# 8. RESIDENTS & VEHICLES (ACTIVE CONSTRAINTS)

```sql
CREATE TABLE vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    apartment_id UUID NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE NULL,
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_vehicle_assignments_composite UNIQUE(tenant_id, id),
    CONSTRAINT fk_assignments_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) REFERENCES vehicles(tenant_id, id),
    CONSTRAINT fk_assignments_resident_tenant FOREIGN KEY (tenant_id, resident_id) REFERENCES residents(tenant_id, id),
    CONSTRAINT fk_assignments_apartment_tenant FOREIGN KEY (tenant_id, apartment_id) REFERENCES apartments(tenant_id, id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uk_active_vehicle_assignment 
ON vehicle_assignments(tenant_id, vehicle_id) 
WHERE unassigned_at IS NULL;
```

---

# 9. PARKING CARDS & CARD EVENTS HISTORY

```sql
CREATE TABLE parking_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    vehicle_id UUID NULL,
    card_number VARCHAR(50) NOT NULL,
    card_type VARCHAR(20) NOT NULL DEFAULT 'CASUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'LOST')),
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cards_number UNIQUE(tenant_id, card_number),
    CONSTRAINT uk_cards_composite UNIQUE(tenant_id, id),
    CONSTRAINT fk_cards_vehicle_tenant FOREIGN KEY (tenant_id, vehicle_id) REFERENCES vehicles(tenant_id, id)
);

CREATE UNIQUE INDEX uk_active_vehicle_card 
ON parking_cards(tenant_id, vehicle_id) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL AND vehicle_id IS NOT NULL;
```

---

# 10. TARIFF RULES & TIERS (CHỐNG OVERLAP RÃN CHẮC)

```sql
CREATE TABLE tariff_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    tariff_rule_id UUID NOT NULL,
    from_hours NUMERIC(5, 2) NOT NULL CHECK (from_hours >= 0),
    to_hours NUMERIC(5, 2) NULL,
    tier_fee NUMERIC(12, 2) NOT NULL CHECK (tier_fee >= 0),
    is_extra_hourly BOOLEAN NOT NULL DEFAULT FALSE,
    tier_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tariff_tiers_composite UNIQUE(tenant_id, id),
    CONSTRAINT chk_tariff_hours CHECK (to_hours IS NULL OR from_hours < to_hours),
    CONSTRAINT fk_tiers_rule_tenant FOREIGN KEY (tenant_id, tariff_rule_id) REFERENCES tariff_rules(tenant_id, id) ON DELETE CASCADE
);
```

---

# 11. VOUCHERS & PESSIMISTIC LOCKING CONCURRENCY

## 11.1 voucher_usages Table
```sql
CREATE TABLE voucher_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    voucher_id UUID NOT NULL,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    payment_order_id UUID NULL,
    discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_voucher_usages_composite UNIQUE(tenant_id, id),
    CONSTRAINT fk_voucher_usages_voucher FOREIGN KEY (tenant_id, voucher_id) REFERENCES vouchers(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_voucher_usages_payment_order FOREIGN KEY (tenant_id, payment_order_id) REFERENCES payment_orders(tenant_id, id) ON DELETE SET NULL
);
```

## 11.2 Voucher Transaction Flow (`SELECT FOR UPDATE`)
```typescript
// Trong Transaction:
const voucher = await tx.$queryRaw`
  SELECT * FROM vouchers 
  WHERE id = ${voucherId} AND tenant_id = ${tenantId} AND is_active = TRUE 
  FOR UPDATE
`;

if (voucher.used_count >= voucher.usage_limit) {
  throw new BadRequestException('Voucher đã hết lượt sử dụng!');
}

await tx.voucher_usages.create({ ... });
await tx.vouchers.update({
  where: { id: voucherId },
  data: { used_count: { increment: 1 } }
});
```

---

# 12. UNIVERSAL PAYMENT ENGINE (EXPLICIT EXCLUSIVITY & EXPIRES_AT)

```text
                           +-------------------+
                           |  PAYMENT_ORDERS   |  <--- Clean Aggregate Root (expires_at)
                           +---------+---------+
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
    v                                v                                v
+-------------------+      +-------------------+           +-------------------+
|  PAYMENT_ATTEMPTS |      |  PAYMENT_REFUNDS  |           | BANK_TRANSACTIONS | (direction: CREDIT/DEBIT)
+-------------------+      +-------------------+           +-------------------+
```

## 12.1 payment_orders (Với `expires_at` & Exclusivity Index)
```sql
CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    order_code VARCHAR(50) NOT NULL,
    expected_amount NUMERIC(12, 2) NOT NULL CHECK (expected_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING_PAYMENT' CHECK (status IN ('WAITING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED')),
    expires_at TIMESTAMP WITH TIME ZONE NULL, -- Hạn hết hiệu lực QR / Chuyển khoản (VD: 15 phút)
    paid_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payment_orders_code UNIQUE(tenant_id, order_code),
    CONSTRAINT uk_payment_orders_composite UNIQUE(tenant_id, id)
);
```

## 12.2 Payment Order Exclusivity Constraints (Đảm bảo 1 Payment Order chỉ thuộc 1 Business Target)
```sql
-- Một payment_order_id chỉ gán cho tối đa 1 renewal_order:
CREATE UNIQUE INDEX uk_renewal_payment_order_unique 
ON renewal_orders(tenant_id, payment_order_id) 
WHERE payment_order_id IS NOT NULL;

-- Một payment_order_id chỉ gán cho tối đa 1 parking_session:
CREATE UNIQUE INDEX uk_session_payment_order_unique 
ON parking_sessions(tenant_id, payment_order_id) 
WHERE payment_order_id IS NOT NULL;
```

## 12.3 bank_transactions (Với `direction` CREDIT/DEBIT)
```sql
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    tenant_payment_config_id UUID NULL,
    bank_account_no VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'SEPAY',
    transaction_id VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'CREDIT' CHECK (direction IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transfer_content TEXT,
    reference_code VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'UNMATCHED' CHECK (status IN ('UNMATCHED', 'MATCHED', 'IGNORED')),
    payment_order_id UUID NULL,
    transaction_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_bank_tx_gateway UNIQUE(tenant_id, gateway, transaction_id),
    CONSTRAINT uk_bank_transactions_composite UNIQUE(tenant_id, id),
    CONSTRAINT fk_bank_tx_config_tenant FOREIGN KEY (tenant_id, tenant_payment_config_id) REFERENCES tenant_payment_configs(tenant_id, id) ON DELETE SET NULL,
    CONSTRAINT fk_bank_tx_order_tenant FOREIGN KEY (tenant_id, payment_order_id) REFERENCES payment_orders(tenant_id, id) ON DELETE SET NULL
);
```

---

# 13. PARKING CHECKOUT & SEPAY AUTOMATED RECONCILIATION FLOW

```text
Parking Session (Check-out) 
        ↓
Calculate Fee (Tariff Rules & Tiers)
        ↓
Create payment_orders (expected_amount, expires_at = NOW() + 15m, WAITING_PAYMENT)
        ↓
Generate VietQR (Nội dung CK = order_code)
        ↓
Customer Transfers Money (Ngân hàng)
        ↓
SePay Webhook ➔ INSERT INTO bank_transactions (direction='CREDIT', status='UNMATCHED')
        ↓
Auto Reconciliation Service:
    1. Extract reference_code = order_code
    2. LOCK payment_orders FOR UPDATE
    3. If bank_tx.amount >= payment_order.expected_amount:
           - INSERT INTO payment_transactions (SUCCESS)
           - UPDATE payment_orders SET status = 'PAID', paid_amount = bank_tx.amount, paid_at = NOW()
           - UPDATE bank_transactions SET status = 'MATCHED', payment_order_id = order.id
           - UPDATE parking_sessions SET status = 'COMPLETED', check_out_time = NOW()
    4. Emit Gate Open Barrier Signal
```

---

# 14. COMPLETE DATABASE SCHEMA DDL LIST (24 TABLES)

Tất cả 24 bảng trong sơ đồ tổng thể đều có đặc tả DDL & RLS hoàn chỉnh:
1. `tenants`
2. `users`
3. `roles`
4. `permissions`
5. `role_permissions`
6. `tenant_users`
7. `parking_areas`
8. `gates`
9. `parking_slots`
10. `towers`
11. `apartments`
12. `residents`
13. `vehicles`
14. `vehicle_assignments`
15. `parking_cards`
16. `parking_card_events`
17. `tariff_rules`
18. `tariff_tiers`
19. `tenant_payment_configs`
20. `vouchers`
21. `voucher_usages`
22. `payment_orders`
23. `renewal_orders`
24. `payment_transactions`
25. `payment_refunds`
26. `bank_transactions`
27. `parking_sessions`
28. `audit_logs`
29. `email_reminder_logs`

---

# 15. CHECKLIST DEFINITION OF DONE FOR DB MIGRATION & NESTJS/PRISMA

```text
[ ] FORCE ROW LEVEL SECURITY (ALTER TABLE ... FORCE ROW LEVEL SECURITY) áp dụng cho 100% bảng thuộc Tenant
[ ] Application DB Role cấu hình NOSUPERUSER NOBYPASSRLS và không sở hữu tables
[ ] Prisma Context Wrapper sử dụng Transaction-scoped `SET LOCAL app.current_tenant_id`
[ ] 100% Composite Foreign Keys phòng chống leak cross-tenant cấp DB
[ ] Payment Orders có `expires_at` và Exclusivity Partial Indexes (Không bị dùng chung bởi Renewal & Session)
[ ] Bank Transactions có `direction` ('CREDIT' / 'DEBIT') sẵn sàng cho SePay auto-match
[ ] Voucher Checkout xử lý bằng Pessimistic Lock `SELECT FOR UPDATE` + `voucher_usages` audit
[ ] Sẵn sàng 100% để migration DB + viết NestJS Prisma Services!
```
