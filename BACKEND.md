# PARKING.GO KIOSK — MASTER IMPLEMENTATION PLAN

## Multi-Tenant Parking Management Platform

---

# 1. MỤC TIÊU HỆ THỐNG

Xây dựng PARKING.GO KIOSK thành một nền tảng quản lý bãi xe Multi-Tenant, có khả năng phục vụ:

* Chung cư
* Khu đô thị
* Tòa nhà
* Bãi xe độc lập
* Nhiều khu vực / nhiều tháp trong cùng một dự án
* Hàng chục đến hàng trăm Tenant

Mục tiêu quan trọng:

1. Một codebase phục vụ nhiều Tenant.
2. Không fork code cho từng chung cư.
3. Tenant mới chủ yếu được tạo bằng cấu hình/database.
4. Tenant A tuyệt đối không truy cập được dữ liệu Tenant B.
5. Mỗi Tenant có cấu hình riêng.
6. Có thể mở rộng từ vài Tenant lên hàng trăm Tenant.
7. Hỗ trợ quản lý xe, cư dân, căn hộ, thẻ, phiên gửi xe, bảng giá, đơn hàng và thanh toán online.
8. Kiến trúc đủ tốt để triển khai production.

---

# 2. KIẾN TRÚC MULTI-TENANT

## Mô hình bắt buộc

Sử dụng:

```text
Shared PostgreSQL Database
        +
tenant_id
        +
PostgreSQL Row Level Security (RLS)
        +
Backend TenantContext
```

Không tạo database riêng cho từng Tenant ở giai đoạn đầu.

Kiến trúc:

```text
                    Internet
                       |
                       v
              +------------------+
              | Reverse Proxy    |
              | / API Gateway    |
              +--------+---------+
                       |
                       v
              +------------------+
              | Authentication   |
              | Authorization     |
              +--------+---------+
                       |
                 JWT / Session
                       |
                       v
              +------------------+
              | Backend API      |
              |                  |
              | TenantContext    |
              +--------+---------+
                       |
                SET LOCAL
             app.current_tenant_id
                       |
                       v
              +------------------+
              | PostgreSQL       |
              |                  |
              | RLS              |
              +------------------+
                       |
          +------------+------------+
          |            |            |
       Tenant A     Tenant B     Tenant C
```

---

# 3. TENANT IDENTIFICATION — QUY TẮC BẢO MẬT

## KHÔNG được tin `X-Tenant-ID` từ frontend như một security boundary.

Frontend có thể gửi:

```http
X-Tenant-ID: TENANT_A
```

nhưng backend phải xác thực Tenant dựa trên:

```text
Authenticated User
        +
User-Tenant Membership
        +
JWT / Session
        +
Server-side TenantContext
```

Không cho phép user tự ý đổi:

```http
X-Tenant-ID: TENANT_B
```

để truy cập Tenant B.

## Tenant resolution

Có thể hỗ trợ:

```text
Subdomain
    ↓
vinhomes.kiosk.com

Domain
    ↓
kiosk.vinhomes-oceanpark.vn

Authenticated user's tenant
    ↓
tenant_users
```

Nhưng cuối cùng backend phải xác định Tenant hợp lệ.

Frontend hostname chỉ là cơ chế discovery/context, KHÔNG phải cơ chế authorization.

---

# 4. TENANT CONTEXT

Backend phải có một TenantContext trung tâm.

Ví dụ logic:

```text
Request
   ↓
Authentication
   ↓
Resolve user
   ↓
Resolve tenant membership
   ↓
Validate tenant
   ↓
TenantContext
   ↓
Database transaction
   ↓
SET LOCAL app.current_tenant_id = tenant.id
   ↓
Query
   ↓
PostgreSQL RLS
```

Không cho controller/service tự truyền `tenant_id` tùy ý nếu có thể lấy từ TenantContext.

Mục tiêu:

```text
Business code
        ↓
TenantContext
        ↓
Database
        ↓
RLS
```

---

# 5. POSTGRESQL RLS

Mọi bảng chứa dữ liệu Tenant phải bật RLS.

Không chỉ bật RLS cho `vehicles`.

Danh sách tối thiểu:

```text
towers
apartments
residents
vehicles
tenant_payment_configs
tariff_rules
vouchers
renewal_orders
payment_transactions
parking_sessions
email_reminder_logs
audit_logs
tenant_users
```

## Policy phải bảo vệ cả đọc và ghi

Cần sử dụng:

```sql
USING (...)
WITH CHECK (...)
```

Không chỉ `USING`.

Mục tiêu:

```text
Tenant A SELECT → chỉ A
Tenant A INSERT → chỉ A
Tenant A UPDATE → chỉ A
Tenant A DELETE → chỉ A
```

Tenant A không thể:

```text
SELECT Tenant B
INSERT record vào Tenant B
UPDATE record Tenant B
DELETE record Tenant B
```

---

# 6. DATABASE SCHEMA

## 6.1 tenants

```text
tenants
-------
id UUID PRIMARY KEY
code VARCHAR UNIQUE
name VARCHAR
domain VARCHAR UNIQUE
contact_email
contact_phone
is_active
created_at
updated_at
```

Khuyến nghị:

* `id` dùng UUID cho quan hệ database.
* `code` dùng business identifier.

Ví dụ:

```text
id   = UUID
code = VINHOMES_OCEAN
```

---

# 7. IDENTITY & AUTHORIZATION

Bổ sung hệ thống:

```text
users
roles
permissions
tenant_users
role_permissions
```

Quan hệ:

```text
users
  |
  +---- tenant_users ---- tenants
  |
  +---- roles
             |
             +---- permissions
```

Một User có thể thuộc nhiều Tenant.

Ví dụ:

```text
Nguyễn A
   |
   +--- Tenant A / Admin
   +--- Tenant B / Viewer
```

## Role đề xuất

```text
SUPER_ADMIN
TENANT_ADMIN
PARKING_MANAGER
GATE_OPERATOR
VIEWER
```

Permission phải tách riêng:

```text
vehicle.read
vehicle.create
vehicle.update
vehicle.delete

parking_session.read
parking_session.create
parking_session.checkout

payment.read
payment.refund

tariff.read
tariff.update

voucher.read
voucher.create
voucher.update

user.manage
tenant.manage
```

---

# 8. TENANT → TOWER → APARTMENT

## towers

```text
id UUID
tenant_id UUID
code
name
description
created_at
updated_at
```

Constraint:

```text
UNIQUE(tenant_id, code)
```

---

## apartments

```text
id UUID
tenant_id UUID
tower_id UUID
room_number
floor_number
owner_name
created_at
updated_at
```

Constraint:

```text
UNIQUE(tower_id, room_number)
```

Quan trọng:

Database phải đảm bảo:

```text
apartment.tenant_id
=
tower.tenant_id
```

Không cho phép:

```text
Apartment Tenant A
        ↓
Tower Tenant B
```

Sử dụng composite FK hoặc cơ chế database tương đương để enforce cross-tenant integrity.

---

# 9. RESIDENTS

```text
residents
---------
id UUID
tenant_id UUID
apartment_id UUID NULL
full_name
phone
email
identity_card
is_active
created_at
updated_at
```

Đảm bảo:

```text
resident.tenant_id
=
apartment.tenant_id
```

nếu apartment tồn tại.

---

# 10. VEHICLES

```text
vehicles
--------
id UUID
tenant_id UUID
resident_id UUID NULL
plate_number
plate_normalized
vehicle_type
card_number
start_date
expiry_date
status
created_at
updated_at
```

Vehicle type:

```text
CAR
MOTORBIKE
ELECTRIC_BIKE
```

Status:

```text
ACTIVE
EXPIRING
EXPIRED
SUSPENDED
```

Constraint:

```text
UNIQUE(tenant_id, plate_normalized)
```

Index:

```sql
CREATE INDEX idx_vehicles_tenant_plate
ON vehicles (tenant_id, plate_normalized);
```

`plate_normalized` dùng để tìm kiếm nhanh.

Ví dụ:

```text
30F-123.45
30F12345
```

---

# 11. PARKING CARD / RFID

Không nên nhét quá nhiều logic vào `vehicles.card_number` nếu hệ thống có khả năng một xe/thẻ thay đổi theo thời gian.

Có thể thiết kế riêng:

```text
parking_cards
-------------
id UUID
tenant_id
vehicle_id
card_number
card_type
status
issued_at
expired_at
created_at
```

Constraint:

```text
UNIQUE(tenant_id, card_number)
```

Cho phép:

```text
Vehicle
   |
   +--- Card cũ
   +--- Card hiện tại
```

---

# 12. TARIFF / BẢNG GIÁ

```text
tariff_rules
------------
id UUID
tenant_id UUID
vehicle_type
tariff_type
monthly_fee
base_hours
base_fee
extra_fee_per_hour
grace_period_minutes
is_active
created_at
updated_at
```

Tariff type:

```text
MONTHLY
CASUAL
```

Ví dụ:

```text
CAR + MONTHLY
CAR + CASUAL
MOTORBIKE + MONTHLY
MOTORBIKE + CASUAL
```

Không hard-code giá trong source code.

Tất cả phải lấy từ database.

---

# 13. PAYMENT CONFIGURATION

Mỗi Tenant có cấu hình thanh toán riêng.

```text
tenant_payment_configs
----------------------
id UUID
tenant_id UUID
provider
bank_bin
bank_account_no
bank_account_name
secret_api_key
qr_timeout_seconds
is_active
created_at
updated_at
```

Có thể hỗ trợ:

```text
VIETQR
SEPAY
MOMO
ZALOPAY
...
```

Secret/API key:

* Không trả về frontend.
* Không log ra console.
* Nên mã hóa hoặc lưu bằng secret manager nếu production.
* Chỉ backend được truy cập.

---

# 14. VOUCHER

```text
vouchers
--------
id UUID
tenant_id UUID
code
discount_type
discount_value
min_order_amount
valid_from
valid_to
usage_limit
used_count
is_active
created_at
updated_at
```

Constraint:

```text
UNIQUE(tenant_id, code)
```

Không để Voucher Tenant A được sử dụng cho Order Tenant B.

---

# 15. ORDER

Dùng một Order làm aggregate cho việc thanh toán.

```text
renewal_orders
--------------
id UUID
tenant_id UUID
order_code
vehicle_id
plate_number
vehicle_type
duration_months
original_amount
discount_amount
final_amount
voucher_id
status
paid_at
new_expiry_date
created_at
updated_at
```

Status:

```text
WAITING_PAYMENT
PAID
EXPIRED
CANCELLED
```

`order_code` phải có scope rõ ràng.

Có thể dùng:

```text
UNIQUE(tenant_id, order_code)
```

nếu business không yêu cầu global uniqueness.

---

# 16. PAYMENT TRANSACTIONS

```text
payment_transactions
--------------------
id UUID
tenant_id UUID
order_id UUID
provider
gateway_transaction_id
amount
payment_method
status
idempotency_key
raw_payload JSONB
webhook_received_at
processed_at
failure_reason
created_at
```

Payment phải xử lý idempotent.

Ví dụ provider gửi cùng webhook 3 lần:

```text
Webhook
Webhook
Webhook
```

Database chỉ được ghi nhận một payment thành công.

Không được:

```text
100,000
+
100,000
+
100,000
```

thành:

```text
300,000
```

khi thực tế chỉ có một giao dịch.

---

# 17. PAYMENT FLOW

## Renewal / online payment

```text
User
 |
 | chọn xe
 v
Vehicle
 |
 | chọn gói
 v
Tariff
 |
 | áp Voucher
 v
Calculate final amount
 |
 v
Create Order
 |
 | WAITING_PAYMENT
 v
Generate QR
 |
 v
User chuyển khoản
 |
 v
Payment Provider / Bank
 |
 v
Webhook
 |
 v
Verify webhook
 |
 v
Find order
 |
 v
Idempotency check
 |
 v
Create Payment Transaction
 |
 v
Mark Order = PAID
 |
 v
Update vehicle expiry
 |
 v
Audit Log
```

Không update:

```text
order = PAID
vehicle expiry = new date
```

mà không có transaction database phù hợp.

---

# 18. PARKING SESSION

```text
parking_sessions
----------------
id UUID
tenant_id UUID
session_code
plate_number
card_number
check_in_time
check_in_image_url
check_out_time
check_out_image_url
calculated_fee
payment_status
gate_in_id
gate_out_id
created_at
updated_at
```

Payment status:

```text
UNPAID
PAID
EXEMPT
```

Index:

```sql
CREATE INDEX idx_sessions_plate
ON parking_sessions (
    tenant_id,
    plate_number,
    payment_status
);
```

---

# 19. PARKING SESSION FLOW

## Xe vào

```text
Camera / RFID
      |
      v
Detect plate/card
      |
      v
Find vehicle
      |
      +---- Registered vehicle
      |
      +---- Casual vehicle
      |
      v
Create parking_session
      |
      v
Save check-in time
      |
      v
Save image
      |
      v
Open gate
```

## Xe ra

```text
Camera / RFID
      |
      v
Find active session
      |
      v
Calculate fee
      |
      v
Check payment
      |
      +---- PAID → Open gate
      |
      +---- UNPAID
               |
               v
          Generate QR
               |
               v
          Wait payment
               |
               v
          Webhook
               |
               v
             PAID
               |
               v
          Open gate
```

---

# 20. FEE CALCULATION

Không hard-code:

```text
if hours > 2 ...
```

Thay vào đó:

```text
Parking Session
      ↓
Load active Tariff
      ↓
Calculate duration
      ↓
Apply grace period
      ↓
Calculate base fee
      ↓
Calculate extra hours
      ↓
Final fee
```

Fee calculation phải là một service độc lập:

```text
ParkingFeeService
```

để có thể test riêng.

---

# 21. AUDIT LOG

Bắt buộc bổ sung:

```text
audit_logs
----------
id UUID
tenant_id UUID
user_id UUID
action
entity_type
entity_id
old_data JSONB
new_data JSONB
ip_address
user_agent
created_at
```

Ví dụ:

```text
TENANT_ADMIN
UPDATE
TARIFF_RULE
CAR_MONTHLY

OLD:
1,200,000

NEW:
1,500,000
```

Các thao tác quan trọng phải audit:

```text
Change tariff
Create voucher
Update vehicle
Delete vehicle
Change payment config
Create order
Payment success
Refund
Manual exemption
Manual checkout
Change user role
```

---

# 22. SOFT DELETE

Không nên cascade delete dữ liệu lịch sử tài chính/parking.

Đặc biệt:

```text
orders
payments
parking_sessions
audit_logs
```

không được mất lịch sử chỉ vì xóa Tenant/Vehicle.

Ưu tiên:

```text
is_active
deleted_at
```

hoặc archival strategy.

`ON DELETE CASCADE` chỉ sử dụng khi thực sự an toàn.

---

# 23. INDEXING

Các index quan trọng:

```sql
vehicles:
(tenant_id, plate_normalized)

vehicles:
(tenant_id, expiry_date, status)

apartments:
(tenant_id, tower_id, room_number)

renewal_orders:
(tenant_id, order_code, status)

parking_sessions:
(tenant_id, plate_number, payment_status)

payment_transactions:
(tenant_id, gateway_transaction_id)

residents:
(tenant_id, phone)

parking_cards:
(tenant_id, card_number)
```

Không tuyên bố `<10ms` chỉ dựa trên index.

Performance target phải được benchmark thực tế.

Khuyến nghị đo:

```text
P50
P95
P99
```

trên dataset lớn.

---

# 24. DATABASE INTEGRITY

Đây là yêu cầu bắt buộc.

Không chỉ application validation.

Database phải đảm bảo quan hệ Tenant.

Ví dụ:

```text
Tower A
  ↓
Apartment A
  ↓
Resident A
  ↓
Vehicle A
```

tất cả phải cùng:

```text
tenant_id = A
```

Không được tồn tại:

```text
Tenant A
  ↓
Vehicle
  ↓
Resident Tenant B
```

Sử dụng:

```text
Composite Foreign Key
+
RLS
+
Application validation
```

để bảo vệ nhiều lớp.

---

# 25. TENANT PROVISIONING

Tenant mới phải có thể tạo mà không cần sửa code.

Flow:

```text
Super Admin
    |
    v
Create Tenant
    |
    +--- Create tenant
    |
    +--- Create default payment config
    |
    +--- Create default tariffs
    |
    +--- Create default roles/config
    |
    +--- Create initial admin
    |
    v
Tenant READY
```

Không tạo source-code fork.

Không copy database thủ công.

---

# 26. TENANT CONFIGURATION

Các cấu hình phải nằm trong database/configuration:

```text
Tenant
 ├── Towers
 ├── Apartments
 ├── Tariffs
 ├── Payment Config
 ├── Voucher
 ├── Parking Rules
 ├── Gates
 ├── Email Config
 └── Branding
```

Không hard-code:

```text
VINHOMES
MASTERI
```

trong source code.

---

# 27. FRONTEND

Frontend phải nhận Tenant context từ server/application configuration.

Ví dụ:

```text
vinhomes.kiosk.com
       ↓
Tenant discovery
       ↓
Backend validation
       ↓
Tenant config
       ↓
Render UI
```

Không hard-code tenant data.

API client có thể gửi:

```http
X-Tenant-ID
```

nhưng backend phải validate nó.

Không dùng header làm authorization.

---

# 28. BACKEND ARCHITECTURE

Tách rõ:

```text
/controllers
/services
/repositories
/modules
/tenant
/auth
/payment
/parking
/vehicle
/tariff
/voucher
/audit
```

Đặc biệt:

```text
TenantContext
AuthService
AuthorizationService
RlsService
```

phải là infrastructure dùng chung.

Không để mỗi module tự implement tenant filtering.

---

# 29. TRANSACTION BOUNDARY

Các nghiệp vụ quan trọng phải chạy trong DB transaction.

Ví dụ payment:

```text
BEGIN

lock order

verify payment

insert payment_transaction

update order

update vehicle expiry

insert audit_log

COMMIT
```

Nếu một bước fail:

```text
ROLLBACK
```

---

# 30. CONCURRENCY

Đặc biệt xử lý:

```text
Hai webhook cùng lúc
Hai operator checkout cùng lúc
Hai request gia hạn cùng lúc
Hai request sử dụng voucher cùng lúc
```

Phải sử dụng:

```text
Database transaction
Row locking
Unique constraint
Idempotency
Optimistic/pessimistic locking
```

phù hợp từng case.

---

# 31. SECURITY REQUIREMENTS

Bắt buộc:

```text
Authentication
Authorization
Tenant isolation
PostgreSQL RLS
Input validation
Rate limiting
Audit log
Secret management
HTTPS
Secure cookies / JWT
Password hashing
Webhook signature verification
Idempotency
SQL injection protection
```

Không log:

```text
password
API secret
bank secret
JWT
payment secret
```

---

# 32. PAYMENT WEBHOOK SECURITY

Webhook phải:

```text
Receive
 ↓
Verify signature / secret
 ↓
Validate provider
 ↓
Validate amount
 ↓
Validate order
 ↓
Validate tenant context
 ↓
Idempotency check
 ↓
Process transaction
```

Không tin:

```text
amount
order_id
status
```

chỉ vì client gửi lên.

---

# 33. REPORTING

Hệ thống phải hỗ trợ báo cáo theo:

```text
Tenant
Tower
Apartment
Vehicle Type
Tariff
Payment
Parking Session
Date Range
```

Ví dụ:

```text
Doanh thu Tenant
Doanh thu theo Tháp
Số xe đang hoạt động
Xe sắp hết hạn
Xe hết hạn
Số lượt vào/ra
Doanh thu vãng lai
Doanh thu vé tháng
Payment success/failure
```

Có thể export:

```text
Excel
CSV
```

---

# 34. EMAIL REMINDER

Giữ bảng:

```text
email_reminder_logs
```

nhưng cần thêm cơ chế job/background worker.

Flow:

```text
Scheduled Job
      |
      v
Find vehicles expiring soon
      |
      v
Check reminder log
      |
      v
Send email
      |
      v
Save result
```

Không gửi email trực tiếp trong HTTP request chính.

---

# 35. STORAGE

Ảnh:

```text
check_in_image_url
check_out_image_url
```

không nên lưu binary trực tiếp trong PostgreSQL.

Sử dụng object storage:

```text
S3 / MinIO / Cloud Storage
```

Database chỉ lưu:

```text
object key
URL
metadata
```

Ví dụ:

```text
parking/{tenant_id}/{session_id}/check-in.jpg
```

Phải đảm bảo object storage cũng được phân vùng theo Tenant.

---

# 36. OBSERVABILITY

Bổ sung:

```text
Structured Logging
Metrics
Tracing
Error Tracking
Health Check
```

Mỗi request nên có:

```text
request_id
tenant_id
user_id
```

để debug.

Ví dụ:

```text
request_id=abc123
tenant=VINHOMES
user=xyz
action=payment.webhook
```

---

# 37. TESTING

Phải có test cho Multi-Tenant.

## Security test

Test:

```text
Tenant A login
Tenant A query
```

→ chỉ thấy A.

Test:

```text
Tenant A cố query ID của Tenant B
```

→ 403 hoặc không tồn tại.

Test:

```text
Tenant A gửi X-Tenant-ID = B
```

→ reject.

Test:

```text
Tenant A INSERT tenant_id = B
```

→ database reject.

---

# 38. TEST PAYMENT

Test:

```text
Payment success
Payment failed
Payment duplicate webhook
Payment wrong amount
Payment expired
Payment invalid signature
Payment cancelled
Concurrent webhook
```

---

# 39. TEST PARKING

Test:

```text
Vehicle check-in
Vehicle check-out
Unknown vehicle
Expired vehicle
Paid vehicle
Unpaid casual session
Grace period
Multiple tariff rules
Concurrent checkout
```

---

# 40. TEST DATA ISOLATION

Tạo:

```text
Tenant A
Tenant B
```

với:

```text
Vehicle A
Vehicle B
Order A
Order B
Payment A
Payment B
Parking Session A
Parking Session B
```

Sau đó chạy toàn bộ API của A.

Không được trả về:

```text
B data
```

Đây là test bắt buộc trước production.

---

# 41. SCALE STRATEGY

Giai đoạn 1:

```text
Shared PostgreSQL
+
RLS
+
tenant_id
```

Giai đoạn 2:

```text
Read Replica
+
Connection Pool
+
Caching
+
Background Jobs
```

Giai đoạn 3:

```text
Partitioning
```

Nếu có Tenant cực lớn:

```text
Hybrid architecture
```

có thể chuyển Tenant lớn sang database riêng mà không thay đổi business logic quá nhiều.

---

# 42. KHÔNG ĐƯỢC LÀM

AI không được:

```text
❌ Trust X-Tenant-ID blindly
❌ Hard-code Tenant
❌ Hard-code tariff
❌ Hard-code bank account
❌ Hard-code payment provider
❌ Query database mà bỏ qua TenantContext
❌ Chỉ filter tenant_id ở frontend
❌ Chỉ dùng application-level filtering
❌ Chỉ bật RLS cho một vài bảng
❌ Tin amount từ client
❌ Process webhook không idempotent
❌ Log secret
❌ Cascade delete payment history
❌ Claim performance without benchmark
❌ Fork source code cho từng Tenant
```

---

# 43. NGUYÊN TẮC QUAN TRỌNG NHẤT

Hệ thống phải có nhiều lớp bảo vệ:

```text
Layer 1
Authentication
       ↓
Layer 2
Authorization
       ↓
Layer 3
TenantContext
       ↓
Layer 4
Database Transaction
       ↓
Layer 5
PostgreSQL RLS
       ↓
Layer 6
Foreign Key / Constraint
       ↓
Layer 7
Audit Log
```

Nếu một layer bị bug, layer khác vẫn phải hạn chế thiệt hại.

---

# 44. IMPLEMENTATION ORDER

AI phải triển khai theo thứ tự:

## Phase 1 — Database Foundation

```text
tenants
users
roles
permissions
tenant_users
```

↓

```text
towers
apartments
residents
vehicles
parking_cards
```

↓

```text
tariff_rules
tenant_payment_configs
vouchers
```

↓

```text
renewal_orders
payment_transactions
```

↓

```text
parking_sessions
```

↓

```text
audit_logs
email_reminder_logs
```

---

## Phase 2 — Multi-Tenant Security

Implement:

```text
TenantContext
Auth
RBAC
RLS
WITH CHECK
Composite FK
Tenant validation
```

Sau đó viết isolation tests.

**Không được tiếp tục business features nếu tenant isolation chưa pass.**

---

## Phase 3 — Parking Core

Implement:

```text
Vehicle CRUD
Resident CRUD
Apartment CRUD
Tower CRUD
Parking Card
Check-in
Check-out
Fee calculation
Tariff
```

---

## Phase 4 — Payment

Implement:

```text
Order
QR
Payment Provider
Webhook
Signature verification
Idempotency
Payment Transaction
Vehicle renewal
```

---

## Phase 5 — Admin

Implement:

```text
Tenant management
User management
Role management
Tariff management
Payment configuration
Voucher management
Parking management
Reports
Audit logs
```

---

## Phase 6 — Background Jobs

Implement:

```text
Email reminders
Expired orders
QR expiration
Vehicle expiration notifications
Payment reconciliation
```

---

## Phase 7 — Performance

Benchmark:

```text
1M vehicles
5M parking sessions
10M payment transactions
100+ tenants
```

Measure:

```text
P50
P95
P99
CPU
RAM
DB connections
Query latency
```

Chỉ sau benchmark mới đưa ra performance SLA.

---

# 45. DEFINITION OF DONE

Feature chỉ được xem là hoàn thành khi:

```text
[ ] Multi-tenant isolation verified
[ ] Authentication implemented
[ ] Authorization implemented
[ ] RLS implemented
[ ] WITH CHECK implemented
[ ] Cross-tenant FK protected
[ ] Validation implemented
[ ] Error handling implemented
[ ] Audit logging implemented where required
[ ] Transaction boundary defined
[ ] Concurrency handled
[ ] Tests written
[ ] Security tests passed
[ ] No secrets exposed
[ ] Logs sanitized
[ ] Documentation updated
```

---

# 46. KẾT QUẢ MONG MUỐN

Cuối cùng hệ thống phải đạt:

```text
                    PARKING.GO
                         |
          +--------------+--------------+
          |              |              |
       Tenant A       Tenant B       Tenant C
          |              |              |
      Tower A1       Tower B1       Tower C1
      Tower A2       Tower B2       Tower C2
          |              |              |
      Residents       Residents       Residents
      Vehicles        Vehicles        Vehicles
      Parking         Parking         Parking
      Payments        Payments        Payments
```

Tất cả dùng:

```text
ONE CODEBASE
ONE SHARED DATABASE
ONE DEPLOYMENT
MULTIPLE TENANTS
```

nhưng dữ liệu được cô lập bằng:

```text
Authentication
+
Authorization
+
TenantContext
+
RLS
+
Database Constraints
```

Mục tiêu cuối cùng:

> **Thêm một chung cư/bãi xe mới chủ yếu bằng configuration + database provisioning, không fork source code và không sửa business logic riêng cho Tenant.**
