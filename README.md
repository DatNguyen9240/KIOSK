# PARKING.GO KIOSK — Hệ Thống Quản Lý Bãi Xe Multi-Tenant Cấp Enterprise

Nền tảng quản lý bãi xe thông minh, đa chi nhánh (Multi-Tenant) tích hợp Kiosk tự động tại cổng, VietQR / SePay Auto-Reconciliation, Quản lý thẻ tháng cư dân và báo cáo công nợ phân khu theo Tháp.

---

## 🌟 Tính Năng Nổi Bật (Core Features)

### 1. Thu Phí Online & Tự Động Đối Soát Ngân Hàng (VietQR & SePay)
- **Tự động sinh mã VietQR tĩnh/động**: Mã QR duy nhất cho từng phiên đỗ xe hoặc đơn gia hạn (hạn hiệu lực 15 phút bảo mật).
- **SePay Bank Reconciliation**: Tự động nhận Webhook chuyển khoản ngân hàng, khớp mã đơn `ORD-...`, xác nhận trạng thái `PAID` và phát tín hiệu mở Barie tự động.
- **Áp mã Voucher giảm giá**: Hỗ trợ voucher giảm % hoặc số tiền cố định, kiểm soát lượt dùng an toàn với Pessimistic Locking `SELECT FOR UPDATE` & Audit log `voucher_usages`.

### 2. Quản Lý Thẻ Xe & Cư Dân Theo Tháp
- **Tìm kiếm đa năng**: Tìm kiếm tức thì theo Biển số xe (được chuẩn hóa), Họ tên cư dân, Số phòng/Căn hộ (ra toàn bộ xe của 1 phòng), hoặc Mã thẻ RFID.
- **Gia hạn thẻ xe tháng Online**: Cư dân truy cập Portal qua đường link web, chọn thời gian gia hạn (từ ngày đến ngày / theo tháng), thanh toán online và nhận hóa đơn lập tức.
- **Nhắc lịch gia hạn tự động**: Tự động gửi Email / thông báo nhắc cư dân khi thẻ xe sắp hết hạn (trước 5-10 ngày).

### 3. Kiosk Trực Cổng & Kiểm Soát Xe Vào / Ra
- **Check-in / Check-out tự động**: Ghi nhận thời gian, ảnh biển số cổng vào (`gate_in`), ảnh cổng ra (`gate_out`), số thẻ xe và trạng thái thanh toán.
- **Tính phí đỗ xe lũy tiến (Multi-Tier Pricing)**: Tính toán tự động theo bảng giá động (`tariff_rules` & `tariff_tiers`: miễn phí gia ân, block 2h đầu, giờ tiếp theo, khung giờ đêm).
- **Trạm Mobile Dự Phòng**: Hỗ trợ App Mobile kiểm soát vào ra tại trạm khi sự cố máy trạm hoặc mất điện.

### 4. Báo Cáo & Quản Trị Multi-Tenant
- **Báo cáo chia theo Tháp**: Phân tích doanh thu và công nợ chi tiết theo từng Tòa/Tháp (Tháp A1, Tháp A2, Tháp M1...).
- **Báo cáo công nợ & doanh thu**: Báo cáo công nợ ngày, công nợ cần thu, danh sách gia hạn xe theo tháng.
- **Cô lập dữ liệu Multi-Tenant tuyệt đối**: Sử dụng PostgreSQL Row Level Security (`FORCE RLS`) + Composite Foreign Keys `(tenant_id, id)` bảo đảm không leak dữ liệu giữa các dự án.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture Stack)

```text
       Frontend (Kiosk Operator UI & Admin Web Portal)
                             │
                             ▼
                 Express / NestJS Backend API
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
PostgreSQL Database                     SePay / VietQR Engine
(24 Tenant-Scoped Tables                (Auto Bank Reconciliation
 + FORCE RLS & Composite FKs)            & Instant Webhooks)
```

- **Backend**: Node.js (ES Module), Express / NestJS.
- **Database**: PostgreSQL 16+ với Row Level Security (`FORCE RLS`) & Composite FK Isolation.
- **Bảo mật**: Application Role `parking_app` (`NOSUPERUSER NOBYPASSRLS`), JWT Tenant Context, Idempotent Webhook Processing.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Khởi tạo Database PostgreSQL
Tạo cơ sở dữ liệu và nạp cấu trúc 24 bảng + seed data:

```bash
# Migration DDL Schema (24 bảng, FORCE RLS, Application Role parking_app)
psql -U postgres -d parking_kiosk -f db/schema.sql

# Seed Data (Tạo Super Admin, Tenant Vinhomes, Tenant Masteri, Cổng, Bảng giá lũy tiến)
psql -U postgres -d parking_kiosk -f db/seed.sql
```

### 3. Chạy Server Backend
```bash
npm start
```
Server sẽ chạy mặc định tại: `http://localhost:3000`

---

## 🧪 Chạy Bộ Test Kiểm Thử (Test Suite)

Chạy bộ test kiểm thử tính cô lập Multi-Tenant, bảo mật ranh giới dữ liệu, engine tính phí lũy tiến và SePay Webhook:

```bash
node tests/tenant-isolation.test.js
```

**Kết quả mong đợi**: `8/8 TESTS PASSED`

---

## 📖 Tài Liệu Kiến Trúc Chi Tiết
- **[BACKEND.md](file:///d:/KIOSK/BACKEND.md)**: Master Spec Kiến trúc 24 bảng Database, RLS Authorization Matrix, Prisma Context Wrapper & SePay Reconciliation Engine.
- **[db/schema.sql](file:///d:/KIOSK/db/schema.sql)**: File DDL SQL hoàn chỉnh sẵn sàng cho Production Migration.