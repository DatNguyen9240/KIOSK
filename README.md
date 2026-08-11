# PARKING KIOSK — Hệ Thống Quản Lý Bãi Xe Multi-Tenant Cấp Enterprise

Nền tảng quản lý bãi xe thông minh, đa chi nhánh (Multi-Tenant) tích hợp Kiosk tự động tại cổng, VietQR / SePay Auto-Reconciliation, Quản lý thẻ tháng cư dân và báo cáo công nợ phân khu theo Tháp.

---

## 🌟 Tính Năng Nổi Bật (Core Features)

### 1. Thu Phí Online & Tự Động Đối Soát Ngân Hàng (VietQR & SePay)
- **Tự động sinh mã VietQR tĩnh/động**: Mã QR duy nhất cho từng phiên đỗ xe hoặc đơn gia hạn (hạn hiệu lực 15 phút bảo mật).
- **SePay Bank Reconciliation**: Tự động nhận Webhook chuyển khoản ngân hàng, khớp mã đơn `ORD-...`, xác nhận trạng thái `PAID` và phát tín hiệu mở Barie tự động.
- **Áp mã Voucher giảm giá**: Hỗ trợ voucher giảm % hoặc số tiền cố định, kiểm soát lượt dùng an toàn với Audit log `voucher_usages`.

### 2. Quản Lý Thẻ Xe & Cư Dân Theo Tháp
- **Tìm kiếm đa năng**: Tìm kiếm tức thì theo Biển số xe (được chuẩn hóa), Họ tên cư dân, Số phòng/Căn hộ (ra toàn bộ xe của 1 phòng), hoặc Mã thẻ RFID.
- **Gia hạn thẻ xe tháng Online**: Cư dân truy cập Portal qua đường link web, chọn thời gian gia hạn, thanh toán online và nhận hóa đơn lập tức.
- **Nhắc lịch gia hạn tự động**: Tự động gửi Email / thông báo nhắc cư dân khi thẻ xe sắp hết hạn.

### 3. Kiosk Trực Cổng & Kiểm Soát Xe Vào / Ra
- **Check-in / Check-out tự động**: Ghi nhận thời gian, ảnh biển số cổng vào (`gate_in`), ảnh cổng ra (`gate_out`), số thẻ xe và trạng thái thanh toán.
- **Tính phí đỗ xe lũy tiến (Multi-Tier Pricing)**: Tính toán tự động theo bảng giá động (`tariff_rules` & `tariff_tiers`).
- **Trạm Mobile Dự Phòng**: Hỗ trợ App Mobile kiểm soát vào ra tại trạm khi sự cố máy trạm hoặc mất điện.

### 4. Báo Cáo & Quản Trị Multi-Tenant
- **Báo cáo chia theo Tháp**: Phân tích doanh thu và công nợ chi tiết theo từng Tòa/Tháp (Tháp A1, Tháp A2, Tháp M1...).
- **Cô lập dữ liệu Multi-Tenant tuyệt đối**: Sử dụng PostgreSQL Row Level Security (`FORCE RLS`) + Composite Foreign Keys `(tenant_id, id)`.

---

## 🐳 Triển Khai Docker Backend & Database

Frontend đã được deploy trực tiếp trên **Vercel**. Hệ thống Backend REST API Engine và PostgreSQL Database được đóng gói Docker cực kỳ gọn nhẹ:

### 1. Khởi chạy Backend API & PostgreSQL Database bằng Docker Compose:
```bash
docker-compose up -d --build
```

- **Backend API**: Running tại `http://localhost:3000` (Healthcheck: `http://localhost:3000/health`)
- **PostgreSQL Database**: Running tại `localhost:5432` (Tự động nạp `db/schema.sql` và `db/seed.sql` khi khởi chạy lần đầu)

### 2. Dừng Container:
```bash
docker-compose down
```

---

## 🧪 Chạy Kiểm Thử Tự Động (Master Test Harness)

Chạy toàn bộ **15 Test Suites (44 Test Cases & Benchmarks)** trong 1 lượt:
```bash
node tests/run-all-tests.js
```