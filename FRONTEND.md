# PARKING.GO KIOSK — ENTERPRISE UI/UX SPECIFICATION
## Multi-Tenant Parking Operational Platform (Figma Scope & Screen Map Spec)

---

## 1. PHÂN BỔ MÔ PHÒNG HỆ THỐNG (90 – 110 MÀN HÌNH UI)

Để đạt tiêu chuẩn vận hành thực tế tại các dự án bất động sản và đô thị thông minh cấp Enterprise (tương tự Vinhomes, CapitaLand, Sun Group), hệ thống giao diện được thiết kế và triển khai với quy mô **90 đến 110 màn hình UI chính**, phân rã thành 3 ứng dụng chuyên biệt:

*   **Web Admin Portal (75 – 85 màn hình)**: Dành cho Ban quản trị nền tảng (Platform Super Admin) và Ban quản lý tòa nhà/tập đoàn (Tenant Admin/Managers) điều hành toàn bộ cấu hình, tài chính, báo cáo và vận hành offline/online.
*   **Mobile Guard App (15 – 20 màn hình)**: Ứng dụng dành cho nhân viên bảo vệ trực chốt cổng kiểm soát xe vào/ra khẩn cấp, scan vé, xử lý sự cố barie và chạy offline.
*   **Resident Portal (10 – 15 màn hình)**: Trang tự phục vụ (Self-Service) dành cho cư dân đăng nhập tự khai báo xe, gia hạn thẻ tháng qua mã VietQR động, xem lịch sử và nhận phiếu thu điện tử.

---

## 2. CHI TIẾT 17 MODULES HỆ THỐNG & CHI TIẾT MÀN HÌNH

### 2.1 Module 1: Login + Security + Profile (5 Màn hình)
*   **User Flow**:
    `Truy cập` ➔ `Nhập Email & Password` ➔ `Yêu cầu xác thực OTP/MFA` ➔ `Xác thực thành công` ➔ `Chọn Dự án (Tenant Space)` ➔ `Vào Dashboard`.
*   **Danh sách màn hình**:
    1.  Màn hình đăng nhập (Enterprise Login Page - hỗ trợ ẩn/hiện cột thương hiệu trên mobile).
    2.  Màn hình quên mật khẩu (Mã xác thực gửi qua Email/SMS).
    3.  Màn hình xác thực hai lớp OTP (MFA Verification Page).
    4.  Màn hình chọn dự án vận hành (Dành cho tài khoản quản lý nhiều dự án/tháp).
    5.  Trang thông tin cá nhân & Đổi mật khẩu (Profile & Password Policy settings).

---

### 2.2 Module 2: Dashboard Enterprise (6 Màn hình)
*   **User Flow**:
    `Vào Dashboard` ➔ `Xem thống kê tổng quan` ➔ `Chọn bộ lọc Dự án/Tháp` ➔ `Xem công suất realtime theo tầng` ➔ `Click xem chi tiết cảnh báo xe lỗi`.
*   **Danh sách màn hình**:
    1.  Dashboard Tổng quan vận hành (Doanh thu hôm nay, Số xe trong bãi, Doanh số, Công nợ).
    2.  Dashboard Drill-down theo Dự án / Phân khu.
    3.  Dashboard Thống kê theo Tháp (Building view: Số xe tầng hầm B1, B2...).
    4.  Dashboard realtime trạm cổng (Realtime Gate status - Live camera feed monitor).
    5.  Bảng theo dõi cảnh báo bất thường (Cảnh báo mất kết nối Barie, Cảnh báo xe đỗ quá hạn).
    6.  Trang biểu đồ xu hướng (Trend Analytics: So sánh doanh thu xe vãng lai vs xe tháng).

---

### 2.3 Module 3: Tenant & Project Management (6 Màn hình)
*   **User Flow**:
    `Danh sách Tenant` ➔ `Tạo mới Tenant` ➔ `Thiết lập Domain / Brand` ➔ `Phân bổ tài nguyên` ➔ `Cấu hình thanh toán`.
*   **Danh sách màn hình**:
    1.  Danh sách đối tác/khách hàng (Tenant List).
    2.  Form tạo mới/Cập nhật Tenant (Provisioning Wizard).
    3.  Cấu hình thương hiệu Tenant (Custom Domain, Logo, Theme color).
    4.  Quản lý dự án/Khu đô thị của Tenant (Project List).
    5.  Cấu hình tham số vận hành chung (Cấu hình múi giờ, Loại xe mặc định).
    6.  Bảng thống kê tài nguyên sử dụng (Dung lượng ảnh lưu trữ, Số API calls).

---

### 2.4 Module 4: User + Role + Permission (RBAC) (8 Màn hình)
*   **User Flow**:
    `Danh sách Nhân viên` ➔ `Tạo mới User` ➔ `Gán vào Tenant` ➔ `Chọn Vai trò (Role)` ➔ `Thiết lập Permission` ➔ `Lưu log phân quyền`.
*   **Danh sách màn hình**:
    1.  Danh sách người dùng nội bộ (Global Users List).
    2.  Form thêm mới/Sửa thông tin nhân viên.
    3.  Danh sách vai trò trong hệ thống (Roles List - PLATFORM vs TENANT scope).
    4.  Form tạo vai trò & check-box gán Permissions.
    5.  Trang cấu hình chi tiết phân quyền (Permission Matrix).
    6.  Quản lý thành viên dự án (Tenant Membership Management).
    7.  Màn hình khóa/Kích hoạt tài khoản nhân viên nhanh.
    8.  Báo cáo lịch sử phân quyền (Security Authorization Log).

---

### 2.5 Module 5: Building / Tower / Parking Infrastructure (8 Màn hình)
*   **User Flow**:
    `Sơ đồ hạ tầng` ➔ `Cấu hình Parking Area` ➔ `Thiết lập Cổng Barie` ➔ `Khai báo Tầng đỗ` ➔ `Cài đặt vị trí Slot realtime (Map view)`.
*   **Danh sách màn hình**:
    1.  Danh sách phân khu đỗ xe (Parking Area List).
    2.  Quản lý tháp/tòa nhà (Towers & Buildings).
    3.  Quản lý căn hộ/phòng ban (Apartments List).
    4.  Danh sách cổng & làn xe (Gates & Lanes Configuration).
    5.  Danh sách tầng hầm đỗ xe (Parking Floors).
    6.  Bản đồ đỗ xe thời gian thực (Realtime Parking Slot Map - hiển thị màu sắc Xanh/Đỏ/Vàng).
    7.  Form thêm mới slot đỗ xe (Slot code, loại slot: CASUAL/RESERVED).
    8.  Cấu hình thiết bị trạm (Camera IP, Barrier IP, đầu đọc thẻ RFID).

---

### 2.6 Module 6: Resident Management (8 Màn hình)
*   **User Flow**:
    `Danh sách cư dân` ➔ `Xem chi tiết căn hộ` ➔ `Đăng ký xe` ➔ `Kiểm tra căn hộ liên đới` ➔ `Đồng bộ từ BMS`.
*   **Danh sách màn hình**:
    1.  Danh sách cư dân (Resident List).
    2.  Trang thông tin chi tiết cư dân (Resident Profile - Hiển thị Căn hộ sở hữu, Xe đăng ký).
    3.  Danh sách căn hộ & Chủ sở hữu (Apartments Registry).
    4.  Form đăng ký xe hộ cư dân (Ban quản lý làm hộ).
    5.  Trang kiểm duyệt hồ sơ đăng ký xe cư dân (Vehicle Requests Review).
    6.  Lịch sử sử dụng dịch vụ của cư dân.
    7.  Form Import cư dân bằng file Excel.
    8.  Màn hình cấu hình đồng bộ dữ liệu tự động từ phần mềm Quản lý căn hộ BMS.

---

### 2.7 Module 7: Vehicle Management (10 Màn hình)
*   **User Flow**:
    `Danh sách xe` ➔ `Tìm kiếm biển số` ➔ `Xem lịch sử hoạt động` ➔ `Thay đổi trạng thái xe` ➔ `Khóa/Mở khóa xe`.
*   **Danh sách màn hình**:
    1.  Danh sách phương tiện đang quản lý (Vehicle Master List).
    2.  Form thêm mới phương tiện (Nhập biển số, Chọn loại xe, Gán thẻ RFID).
    3.  Trang thông tin chi tiết phương tiện (Vehicle Profile).
    4.  Lịch sử ra vào chi tiết của xe (LPR log kèm ảnh camera chụp biển số trước/sau).
    5.  Lịch sử thanh toán & Nợ cước của xe.
    6.  Danh sách xe bị cảnh báo / Blacklist xe.
    7.  Form điều chuyển chủ sở hữu xe (Vehicle Assignment Transfer).
    8.  Màn hình cập nhật nhanh trạng thái xe (ACTIVE, SUSPENDED, EXPIRED).
    9.  Báo cáo thống kê cơ cấu phương tiện (Biểu đồ tròn tỷ lệ Xe hơi vs Xe máy).
    10. Popup xác nhận đổi biển số xe vật lý.

---

### 2.8 Module 8: Card Management (7 Màn hình)
*   **User Flow**:
    `Quản lý kho thẻ` ➔ `Cấp phát thẻ cho cư dân` ➔ `Báo mất thẻ` ➔ `Thu hồi thẻ` ➔ `Hủy thẻ hỏng`.
*   **Danh sách màn hình**:
    1.  Danh sách thẻ RFID đang hoạt động (Active Cards List).
    2.  Trang quản lý kho thẻ gốc (Card Inventory - In Stock, Faulty, Lost, Recalled).
    3.  Form nhập kho thẻ hàng loạt (Batch RFID import).
    4.  Popup gán thẻ cho phương tiện (Card assignment).
    5.  Màn hình xử lý báo mất thẻ & cấp thẻ thay thế (Lost card replacement flow).
    6.  Lịch sử sự kiện vòng đời thẻ (Card Events History - Issued, Blocked, Revoked).
    7.  Báo cáo tỷ lệ hao hụt & Thẻ hỏng.

---

### 2.9 Module 9: Monthly Subscription / Gia hạn thẻ (8 Màn hình)
*   **User Flow**:
    `Danh sách sắp hết hạn` ➔ `Chọn xe gia hạn` ➔ `Chọn gói plan` ➔ `Tính tiền` ➔ `Áp voucher` ➔ `Tạo QR thanh toán` ➔ `Kích hoạt chu kỳ mới`.
*   **Danh sách màn hình**:
    1.  Danh sách thẻ xe tháng sắp hết hạn (Expiry Monitor).
    2.  Giao diện gia hạn nhanh tại quầy (Quick Renewal at Desk).
    3.  Gia hạn hàng loạt xe theo căn hộ/chủ hộ (Bulk Renewal).
    4.  Bảng cấu hình gói cước tháng (Subscription Tariff Rules).
    5.  Trang chi tiết vòng đời thuê bao (`subscriptions` lifecycle management).
    6.  Giao diện áp dụng Voucher giảm giá gia hạn.
    7.  Màn hình xuất hóa đơn & Phiếu thu điện tử (Receipt PDF).
    8.  Báo cáo tỷ lệ gia hạn đúng hạn (Subscription Retention Report).

---

### 2.10 Module 10: Visitor Parking / Xe vãng lai (7 Màn hình)
*   **User Flow**:
    `Tra cứu xe hiện tại trong bãi` ➔ `Nhập biển số` ➔ `Tự động tính phí theo block` ➔ `Tạo mã VietQR` ➔ `Khách quét thanh toán` ➔ `Mở Barie`.
*   **Danh sách màn hình**:
    1.  Danh sách xe vãng lai hiện tại đang ở trong bãi (Casual Cars inside).
    2.  Màn hình tra cứu phí đỗ xe vãng lai nhanh.
    3.  Giao diện cấu hình bảng giá vé vãng lai theo lũy tiến (Tariff Tiers Config).
    4.  Màn hình thanh toán trực tiếp Kiosk VietQR (Có đồng hồ đếm ngược 120s).
    5.  Trang lịch sử xe vãng lai đã ra khỏi bãi.
    6.  Giao diện xử lý thất lạc vé / thẻ vãng lai tại cổng.
    7.  Popup xác nhận cho xe ra không thu phí (Miễn phí có lý do: Xe cứu hỏa, Xe rác).

---

### 2.11 Module 11: Payment + Wallet + QR + Refund (10 Màn hình)
*   **User Flow**:
    `Xem giao dịch` ➔ `Kiểm tra cổng thanh toán` ➔ `Thực hiện đối soát` ➔ `Xử lý Refund` ➔ `Báo cáo Settlement`.
*   **Danh sách màn hình**:
    1.  Nhật ký giao dịch thanh toán toàn hệ thống (Payment Transactions Log).
    2.  Quản lý tài khoản ngân hàng & cấu hình VietQR/SePay của các Tenant.
    3.  Trang theo dõi trạng thái đơn hàng (Payment Orders Monitor).
    4.  Giao diện đối soát tự động ngân hàng (Auto-Reconciliation Dashboard).
    5.  Danh sách giao dịch chưa khớp tiền (Unmatched/Pending transactions).
    6.  Form phê duyệt hoàn tiền (Refund Request Form).
    7.  Danh sách lịch sử hoàn tiền (Refund History).
    8.  Trang cấu hình tham số thanh toán (Timeout, Phí gateway).
    9.  Báo cáo dòng tiền thanh toán (Settlement Report).
    10. Báo cáo tỷ lệ giao dịch lỗi / Timeout giao dịch.

---

### 2.12 Module 12: Voucher Management (4 Màn hình)
*   **User Flow**:
    `Tạo Voucher` ➔ `Thiết lập điều kiện` ➔ `Phát hành` ➔ `Theo dõi lượt dùng`.
*   **Danh sách màn hình**:
    1.  Danh sách Voucher & Khuyến mãi (Vouchers List).
    2.  Form tạo mới Voucher (Mã code, Loại: % hoặc Fixed, Hạn dùng, Số lượng giới hạn).
    3.  Báo cáo lịch sử chi tiết sử dụng voucher (Voucher Usages Audit).
    4.  Màn hình thiết lập điều kiện áp dụng (Ví dụ: Chỉ áp dụng cho ô tô, Chỉ áp dụng từ tháng thứ 3).

---

### 2.13 Module 13: Debt Management (8 Màn hình)
*   **User Flow**:
    `Phát sinh công nợ` ➔ `Phân bổ theo tháp` ➔ `Nhắc nợ tự động` ➔ `Cư dân nộp tiền` ➔ `Khớp nợ`.
*   **Danh sách màn hình**:
    1.  Báo cáo tổng hợp công nợ (Debt Overview).
    2.  Danh sách công nợ chi tiết theo từng tháp/tòa nhà.
    3.  Danh sách căn hộ nợ cước phí gửi xe quá hạn.
    4.  Form cấu hình nhắc nợ tự động (Email reminder scheduler config).
    5.  Màn hình gửi thông báo nhắc nợ hàng loạt (Bulk notification push).
    6.  Lịch sử thu nợ và khớp nợ (Debt settlement log).
    7.  Báo cáo tuổi nợ (Aging Report: Nợ quá hạn 30, 60, 90 ngày).
    8.  Trang xuất bản ghi thông báo nợ gửi cư dân.

---

### 2.14 Module 14: Gate Control App (Mobile) (12 Màn hình)
*   **User Flow**:
    `Login` ➔ `Chọn Làn xe` ➔ `Xem luồng camera realtime` ➔ `Nhận diện biển số` ➔ `Bấm nút mở cổng/Xác nhận lỗi` ➔ `Chuyển chế độ Offline khi mất mạng`.
*   **Danh sách màn hình**:
    1.  Màn hình đăng nhập dành cho Bảo vệ.
    2.  Màn hình chọn Trạm kiểm soát & Làn xe trực chốt.
    3.  Màn hình giám sát làn vào (Hiển thị LPR camera, Biển số nhận diện, Ảnh chụp xe).
    4.  Màn hình giám sát làn ra (Tính phí xe vãng lai, hiển thị QR code thanh toán).
    5.  Màn hình nhập tay biển số khẩn cấp (Manual Plate search).
    6.  Chế độ hoạt động ngoại tuyến (Offline Mode interface - lưu sync queue local).
    7.  Trang hàng đợi dữ liệu chờ đồng bộ (Sync Queue Monitor).
    8.  Lịch sử xe ra vào trạm trực cổng (Shift Entry history).
    9.  Màn hình ghi nhận sự cố (Báo cáo mất điện, Cứu hộ Barie hỏng).
    10. Trang cài đặt thông số phần cứng cổng (Chọn nguồn camera, tốc độ Barie).
    11. Giao diện quét mã vạch / Vé xe giấy khẩn cấp.
    12. Màn hình bàn giao ca bảo vệ (Shift Handover summary).

---

### 2.15 Module 15: Report Center (10 Màn hình)
*   **User Flow**:
    `Chọn loại báo cáo` ➔ `Chọn bộ lọc (Thời gian, Phân khu)` ➔ `Tạo báo cáo` ➔ `Xuất dữ liệu Excel/CSV/PDF`.
*   **Danh sách màn hình**:
    1.  Báo cáo doanh thu tổng hợp (Revenue Report).
    2.  Báo cáo doanh thu chi tiết theo Tháp (Building Tower revenue).
    3.  Báo cáo lưu lượng phương tiện ra vào bãi (Traffic Flow chart).
    4.  Báo cáo tần suất & Công suất lấp đầy bãi xe (Realtime Capacity report).
    5.  Báo cáo thống kê công nợ.
    6.  Báo cáo hiệu quả sử dụng Voucher khuyến mãi.
    7.  Báo cáo nhật ký đối soát ngân hàng.
    8.  Báo cáo so sánh lưu lượng giờ cao điểm.
    9.  Giao diện quản lý hàng đợi xuất báo cáo tự động gửi định kỳ qua email.
    10. Trung tâm tải xuống file báo cáo (Download Center).

---

### 2.16 Module 16: Notification / Email Reminder (4 Màn hình)
*   **User Flow**:
    `Cấu hình Template` ➔ `Thiết lập Event Trigger` ➔ `Xem trạng thái gửi` ➔ `Sửa hàng đợi`.
*   **Danh sách màn hình**:
    1.  Quản lý cấu hình mẫu thông báo (Email / SMS Templates Editor).
    2.  Cấu hình luật kích hoạt gửi tin (Notification Rule engine - VD: gửi SMS khi barie mở thủ công).
    3.  Nhật ký gửi tin chi tiết (Notification Logs - hiển thị PENDING, SENT, FAILED).
    4.  Bảng thống kê tỷ lệ gửi tin thành công & Quản lý hàng đợi khẩn cấp.

---

### 2.17 Module 17: Audit Log / System Log (4 Màn hình)
*   **User Flow**:
    `Vào Security Center` ➔ `Bộ lọc tác nhân` ➔ `Xem chi tiết log thay đổi dữ liệu` ➔ `Xuất file kiểm toán`.
*   **Danh sách màn hình**:
    1.  Nhật ký hành động người dùng (Admin Audit Logs - WHO, WHEN, ACTION, IP).
    2.  Trang so sánh chi tiết dữ liệu thay đổi (JSON diff view: OLD DATA vs NEW DATA).
    3.  Nhật ký hệ thống / System Error Logs (Dành cho IT/Kỹ thuật theo dõi lỗi DB, Gateway timeout).
    4.  Báo cáo kiểm toán bảo mật định kỳ (Security Compliance Report).

---

## 3. TỔNG KẾT & CHI TIẾT SỐ LƯỢNG MÀN HÌNH

| Module | Phân hệ chức năng | Số màn hình cốt lõi |
| :--- | :--- | :---: |
| **01** | Login + Security + Profile | 5 |
| **02** | Dashboard Enterprise | 6 |
| **03** | Tenant / Project Management | 6 |
| **04** | User + Role + Permission (RBAC) | 8 |
| **05** | Building / Tower / Parking Infrastructure | 8 |
| **06** | Resident Management | 8 |
| **07** | Vehicle Management | 10 |
| **08** | Card Management | 7 |
| **09** | Monthly Subscription / Gia hạn thẻ | 8 |
| **10** | Visitor Parking / Xe vãng lai | 7 |
| **11** | Payment + Wallet + QR + Refund | 10 |
| **12** | Voucher Management | 4 |
| **13** | Debt Management | 8 |
| **14** | Gate Control App (Mobile) | 12 |
| **15** | Report Center | 10 |
| **16** | Notification / Email Reminder | 4 |
| **17** | Audit Log / System Log | 4 |
| **Tổng**| **17 Phân hệ chức năng** | **105 Màn hình** |

### Quy mô thiết kế Figma thực tế (Production Level Design):
*   **Core Screens (Màn hình chính tĩnh)**: ~75 – 85 màn hình Web Admin + ~15 màn hình Mobile App.
*   **Component States & Modals**: ~150+ đến 200+ trạng thái phụ (bao gồm: error/empty state, loading skeleton, confirmation popups, các trường thông tin ẩn/hiện động, và màn hình phân quyền tương ứng).
*   **Resident Portal (Self-Service)**: Thiết kế chuẩn Responsive hỗ trợ chuyển đổi giao diện mượt mà trên Mobile Web cho cư dân thực hiện quét mã VietQR gia hạn vé xe.