let dotenv = null;
try {
  dotenv = await import('dotenv');
  dotenv.default?.config();
} catch (e) {
  // dotenv optional
}

let Pool = null;
try {
  const pgModule = await import('pg');
  Pool = pgModule.default?.Pool || pgModule.Pool;
} catch (e) {
  // pg module optional
}

const pgConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/parking_kiosk',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let dbPool = null;
let isPgAvailable = false;

if (Pool) {
  try {
    dbPool = new Pool(pgConfig);
  } catch (e) {
    console.log('[Database] PostgreSQL pool init skipped');
  }
}

/**
 * Executes a callback within a scoped PostgreSQL Database transaction with Row Level Security (RLS).
 * Sets `SET LOCAL app.current_tenant_id = tenantId` before executing any business queries.
 */
export async function withTenantContext(tenantId, callback, isSuperAdmin = false) {
  if (!isPgAvailable || !dbPool) {
    return callback(createMockTenantDbClient(tenantId, isSuperAdmin));
  }

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    if (isSuperAdmin) {
      await client.query("SET LOCAL app.is_super_admin = 'true'");
    } else if (tenantId) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
    }

    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Checks PostgreSQL connectivity on startup.
 */
export async function checkDatabaseHealth() {
  if (!dbPool) return false;
  try {
    const client = await dbPool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    isPgAvailable = true;
    console.log('[Database] PostgreSQL connection verified:', res.rows[0].now);
    return true;
  } catch (err) {
    isPgAvailable = false;
    console.log('[Database] PostgreSQL not reached. Operating in high-performance Multi-Tenant Memory Mode.');
    return false;
  }
}

// =============================================================================
// MULTI-TENANT IN-MEMORY STORE FALLBACK (Clean Modular Development Adapter)
// =============================================================================
export const MEMORY_DB = {
  roles: [
    { id: '00000000-0000-0000-0000-000000000001', code: 'SUPER_ADMIN', name: 'Super Administrator' },
    { id: '00000000-0000-0000-0000-000000000002', code: 'TENANT_ADMIN', name: 'Tenant Administrator' },
    { id: '00000000-0000-0000-0000-000000000003', code: 'PARKING_MANAGER', name: 'Parking Manager' },
    { id: '00000000-0000-0000-0000-000000000004', code: 'GATE_OPERATOR', name: 'Gate Operator' }
  ],
  tenants: [
    { id: '11111111-1111-1111-1111-111111111111', code: 'VINHOMES_OCEAN', name: 'Vinhomes Ocean Park', domain: 'vinhomes.kiosk.com', is_active: true },
    { id: '22222222-2222-2222-2222-222222222222', code: 'MASTERI_WATERFRONT', name: 'Masteri Waterfront', domain: 'masteri.kiosk.com', is_active: true }
  ],
  users: [
    { id: 'a0000000-0000-0000-0000-000000000000', email: 'superadmin@PARKING', fullName: 'Super Administrator', isSuperAdmin: true },
    { id: 'a1111111-1111-1111-1111-111111111111', email: 'admin@vinhomes.vn', fullName: 'Nguyễn Quản Lý (Vinhomes)', isSuperAdmin: false },
    { id: 'a2222222-2222-2222-2222-222222222222', email: 'admin@masteri.vn', fullName: 'Trần Quản Lý (Masteri)', isSuperAdmin: false }
  ],
  tenant_users: [
    { tenant_id: '11111111-1111-1111-1111-111111111111', user_id: 'a1111111-1111-1111-1111-111111111111', role_id: '00000000-0000-0000-0000-000000000002', role: 'TENANT_ADMIN' },
    { tenant_id: '22222222-2222-2222-2222-222222222222', user_id: 'a2222222-2222-2222-2222-222222222222', role_id: '00000000-0000-0000-0000-000000000002', role: 'TENANT_ADMIN' }
  ],
  parking_areas: [
    { id: 'pa111111-0000-0000-0000-0000000000b1', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'AREA_B1', name: 'Hầm B1 Vinhomes Ocean Park', is_active: true },
    { id: 'pa222222-0000-0000-0000-0000000000b1', tenant_id: '22222222-2222-2222-2222-222222222222', code: 'AREA_B1', name: 'Hầm B1 Masteri Waterfront', is_active: true }
  ],
  gates: [
    { id: 'g1111111-0000-0000-0000-00000000in01', tenant_id: '11111111-1111-1111-1111-111111111111', area_id: 'pa111111-0000-0000-0000-0000000000b1', code: 'GATE_IN_1', name: 'Cổng Vào 1 Hầm B1', gate_type: 'IN', is_active: true },
    { id: 'g1111111-0000-0000-0000-0000000out1', tenant_id: '11111111-1111-1111-1111-111111111111', area_id: 'pa111111-0000-0000-0000-0000000000b1', code: 'GATE_OUT_1', name: 'Cổng Ra 1 Hầm B1', gate_type: 'OUT', is_active: true },
    { id: 'g2222222-0000-0000-0000-00000000in01', tenant_id: '22222222-2222-2222-2222-222222222222', area_id: 'pa222222-0000-0000-0000-0000000000b1', code: 'GATE_IN_1', name: 'Cổng Vào 1 Masteri', gate_type: 'IN', is_active: true },
    { id: 'g2222222-0000-0000-0000-0000000out1', tenant_id: '22222222-2222-2222-2222-222222222222', area_id: 'pa222222-0000-0000-0000-0000000000b1', code: 'GATE_OUT_1', name: 'Cổng Ra 1 Masteri', gate_type: 'OUT', is_active: true }
  ],
  towers: [
    { id: 't1-a1', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'A1', name: 'Tháp A1 - Sapphire 1' },
    { id: 't1-a2', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'A2', name: 'Tháp A2 - Sapphire 2' },
    { id: 't1-a3', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'A3', name: 'Tháp A3 - Sapphire 3' },
    { id: 't2-m1', tenant_id: '22222222-2222-2222-2222-222222222222', code: 'M1', name: 'Tháp M1 - Miami' },
    { id: 't2-m2', tenant_id: '22222222-2222-2222-2222-222222222222', code: 'M2', name: 'Tháp M2 - Hawaii' }
  ],
  apartments: [
    { id: 'apt-1205', tenant_id: '11111111-1111-1111-1111-111111111111', tower_id: 't1-a1', room_number: 'A1-1205', floor_number: 12, owner_name: 'Trần Văn Tuấn' },
    { id: 'apt-0806', tenant_id: '11111111-1111-1111-1111-111111111111', tower_id: 't1-a2', room_number: 'A2-0806', floor_number: 8, owner_name: 'Nguyễn Thị Hằng' },
    { id: 'apt-0501', tenant_id: '22222222-2222-2222-2222-222222222222', tower_id: 't2-m1', room_number: 'M1-0501', floor_number: 5, owner_name: 'Phạm Hoàng Minh' }
  ],
  residents: [
    { id: 'res-1', tenant_id: '11111111-1111-1111-1111-111111111111', apartment_id: 'apt-1205', full_name: 'Trần Văn Tuấn', phone: '0912345678', email: 'tuan.tv@gmail.com' },
    { id: 'res-2', tenant_id: '11111111-1111-1111-1111-111111111111', apartment_id: 'apt-0806', full_name: 'Nguyễn Thị Hằng', phone: '0987654321', email: 'hang.nt@gmail.com' },
    { id: 'res-3', tenant_id: '22222222-2222-2222-2222-222222222222', apartment_id: 'apt-0501', full_name: 'Phạm Hoàng Minh', phone: '0933445566', email: 'minh.ph@gmail.com' }
  ],
  vehicles: [
    { id: 'V01', tenant_id: '11111111-1111-1111-1111-111111111111', plateNumber: '30F-123.45', plateNormalized: '30F12345', residentName: 'Trần Văn Tuấn', apartmentNumber: 'A1-1205', vehicleType: 'CAR', vehicleName: 'Honda CR-V', cardNumber: 'CARD-8831', status: 'ACTIVE', expireDate: '2026-08-30' },
    { id: 'V02', tenant_id: '11111111-1111-1111-1111-111111111111', plateNumber: '30A-789.10', plateNormalized: '30A78910', residentName: 'Nguyễn Thị Hằng', apartmentNumber: 'A2-0806', vehicleType: 'CAR', vehicleName: 'Toyota Camry', cardNumber: 'CARD-8832', status: 'EXPIRING_SOON', expireDate: '2026-08-10' },
    { id: 'V03', tenant_id: '11111111-1111-1111-1111-111111111111', plateNumber: '51H-222.22', plateNormalized: '51H22222', residentName: 'Trần Văn Tuấn', apartmentNumber: 'A1-1205', vehicleType: 'MOTORBIKE', vehicleName: 'Honda SH 150i', cardNumber: 'CARD-8833', status: 'EXPIRED', expireDate: '2026-07-28' },
    { id: 'V04', tenant_id: '22222222-2222-2222-2222-222222222222', plateNumber: '29A-999.88', plateNormalized: '29A99988', residentName: 'Phạm Hoàng Minh', apartmentNumber: 'M1-0501', vehicleType: 'CAR', vehicleName: 'Mercedes C200', cardNumber: 'CARD-9901', status: 'ACTIVE', expireDate: '2026-09-15' }
  ],
  parking_cards: [
    { id: 'c1111111-0000-0000-0000-000000008831', tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_id: 'V01', card_number: 'CARD-8831', card_type: 'MONTHLY', status: 'ACTIVE' },
    { id: 'c1111111-0000-0000-0000-000000008832', tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_id: 'V02', card_number: 'CARD-8832', card_type: 'MONTHLY', status: 'ACTIVE' },
    { id: 'c2222222-0000-0000-0000-000000009901', tenant_id: '22222222-2222-2222-2222-222222222222', vehicle_id: 'V04', card_number: 'CARD-9901', card_type: 'MONTHLY', status: 'ACTIVE' }
  ],
  tariff_rules: [
    { id: 'tr111111-0000-0000-0000-000000car_m', tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'CAR', tariff_type: 'MONTHLY', monthly_fee: 1250000, grace_period_minutes: 15, is_active: true },
    { id: 'tr111111-0000-0000-0000-000000car_c', tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'CAR', tariff_type: 'CASUAL', monthly_fee: 0, grace_period_minutes: 15, is_active: true },
    { id: 'tr111111-0000-0000-0000-000000moto_m', tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'MOTORBIKE', tariff_type: 'MONTHLY', monthly_fee: 120000, grace_period_minutes: 15, is_active: true },
    { id: 'tr111111-0000-0000-0000-000000moto_c', tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'MOTORBIKE', tariff_type: 'CASUAL', monthly_fee: 0, grace_period_minutes: 15, is_active: true }
  ],
  tariff_tiers: [
    { tenant_id: '11111111-1111-1111-1111-111111111111', tariff_rule_id: 'tr111111-0000-0000-0000-000000car_c', from_hours: 0, to_hours: 2.0, tier_fee: 25000, is_extra_hourly: false, tier_order: 1 },
    { tenant_id: '11111111-1111-1111-1111-111111111111', tariff_rule_id: 'tr111111-0000-0000-0000-000000car_c', from_hours: 2.0, to_hours: 6.0, tier_fee: 15000, is_extra_hourly: true, tier_order: 2 },
    { tenant_id: '11111111-1111-1111-1111-111111111111', tariff_rule_id: 'tr111111-0000-0000-0000-000000car_c', from_hours: 6.0, to_hours: null, tier_fee: 20000, is_extra_hourly: true, tier_order: 3 }
  ],
  vouchers: [
    { id: 'vch-1', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'HE2024', discount_type: 'PERCENTAGE', discount_value: 10, min_order_amount: 100000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 500, used_count: 5, is_active: true },
    { id: 'vch-2', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'TRIAN100K', discount_type: 'FIXED', discount_value: 100000, min_order_amount: 500000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 200, used_count: 12, is_active: true }
  ],
  tenant_payment_configs: [
    { id: 'tpc-1', tenant_id: '11111111-1111-1111-1111-111111111111', provider: 'VIETQR', bank_bin: '970422', bank_account_no: '0000150005814', bank_account_name: 'NGUYEN THANH DAT', secret_api_key_encrypted: 'vh_secret_key_8899', qr_timeout_seconds: 900, is_active: true },
    { id: 'tpc-2', tenant_id: '22222222-2222-2222-2222-222222222222', provider: 'VIETQR', bank_bin: '970422', bank_account_no: '0000150005814', bank_account_name: 'NGUYEN THANH DAT', secret_api_key_encrypted: 'mw_secret_key_1122', qr_timeout_seconds: 900, is_active: true }
  ],
  payment_orders: [],
  renewal_orders: [],
  payment_transactions: [],
  payment_refunds: [],
  bank_transactions: [],
  parking_sessions: [],
  voucher_usages: [],
  audit_logs: []
};

function createMockTenantDbClient(tenantId, isSuperAdmin) {
  return {
    query: async (sqlText, params = []) => {
      return { rows: [] };
    }
  };
}
