/**
 * Front-end Client Side Mock Data for local testing and standalone mode
 */

export const MOCK_TENANTS = [
  { id: '11111111-1111-1111-1111-111111111111', code: 'VINHOMES_OCEAN', name: 'Vinhomes Ocean Park', domain: 'vinhomes.kiosk.com', is_active: true },
  { id: '22222222-2222-2222-2222-222222222222', code: 'MASTERI_WATERFRONT', name: 'Masteri Waterfront', domain: 'masteri.kiosk.com', is_active: true }
];

export const MOCK_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000000', email: 'superadmin@PARKING', fullName: 'Super Administrator', isSuperAdmin: true },
  { id: 'a1111111-1111-1111-1111-111111111111', email: 'admin@vinhomes.vn', fullName: 'Nguyễn Quản Lý (Vinhomes)', isSuperAdmin: false },
  { id: 'a2222222-2222-2222-2222-222222222222', email: 'admin@masteri.vn', fullName: 'Trần Quản Lý (Masteri)', isSuperAdmin: false }
];

export const MOCK_VOUCHERS = [
  { id: 'vch-1', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'HE2024', discount_type: 'PERCENTAGE', discount_value: 10, min_order_amount: 100000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 500, used_count: 5, is_active: true },
  { id: 'vch-2', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'TRIAN100K', discount_type: 'FIXED', discount_value: 100000, min_order_amount: 500000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 200, used_count: 12, is_active: true }
];

export const MOCK_RESIDENTS = [
  { id: 'res-1', tenant_id: '11111111-1111-1111-1111-111111111111', apartment_id: 'apt-1205', full_name: 'Trần Văn Tuấn', phone: '0912345678', email: 'tuan.tv@gmail.com' },
  { id: 'res-2', tenant_id: '11111111-1111-1111-1111-111111111111', apartment_id: 'apt-0806', full_name: 'Nguyễn Thị Hằng', phone: '0987654321', email: 'hang.nt@gmail.com' }
];

export const MOCK_VEHICLES = [
  { id: 'V01', tenant_id: '11111111-1111-1111-1111-111111111111', plateNumber: '30F-123.45', plateNormalized: '30F12345', residentName: 'Trần Văn Tuấn', apartmentNumber: 'A1-1205', vehicleType: 'CAR', vehicleName: 'Honda CR-V', cardNumber: 'CARD-8831', status: 'ACTIVE', expireDate: '2026-08-30' },
  { id: 'V02', tenant_id: '11111111-1111-1111-1111-111111111111', plateNumber: '30A-789.10', plateNormalized: '30A78910', residentName: 'Nguyễn Thị Hằng', apartmentNumber: 'A2-0806', vehicleType: 'CAR', vehicleName: 'Toyota Camry', cardNumber: 'CARD-8832', status: 'EXPIRING_SOON', expireDate: '2026-08-10' },
  { id: 'V03', tenant_id: '11111111-1111-1111-1111-111111111111', plateNumber: '51H-222.22', plateNormalized: '51H22222', residentName: 'Trần Văn Tuấn', apartmentNumber: 'A1-1205', vehicleType: 'MOTORBIKE', vehicleName: 'Honda SH 150i', cardNumber: 'CARD-8833', status: 'EXPIRED', expireDate: '2026-07-28' }
];
