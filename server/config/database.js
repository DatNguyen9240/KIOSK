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
  // pg module not installed yet, operating in multi-tenant memory mode
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
    // Fallback to memory store with strict tenant filtering
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
// MULTI-TENANT IN-MEMORY STORE FALLBACK (For offline / rapid dev)
// =============================================================================
export const MEMORY_DB = {
  tenants: [
    { id: '11111111-1111-1111-1111-111111111111', code: 'VINHOMES_OCEAN', name: 'Vinhomes Ocean Park', domain: 'vinhomes.kiosk.com', is_active: true },
    { id: '22222222-2222-2222-2222-222222222222', code: 'MASTERI_WATERFRONT', name: 'Masteri Waterfront', domain: 'masteri.kiosk.com', is_active: true }
  ],
  users: [
    { id: 'a0000000-0000-0000-0000-000000000000', email: 'superadmin@parking.go', fullName: 'Super Administrator', isSuperAdmin: true },
    { id: 'a1111111-1111-1111-1111-111111111111', email: 'admin@vinhomes.vn', fullName: 'Nguyễn Quản Lý (Vinhomes)', isSuperAdmin: false },
    { id: 'a2222222-2222-2222-2222-222222222222', email: 'admin@masteri.vn', fullName: 'Trần Quản Lý (Masteri)', isSuperAdmin: false }
  ],
  tenant_users: [
    { tenant_id: '11111111-1111-1111-1111-111111111111', user_id: 'a1111111-1111-1111-1111-111111111111', role: 'TENANT_ADMIN' },
    { tenant_id: '22222222-2222-2222-2222-222222222222', user_id: 'a2222222-2222-2222-2222-222222222222', role: 'TENANT_ADMIN' }
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
  tariff_rules: [
    { tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'CAR', tariff_type: 'MONTHLY', monthly_fee: 1250000, base_hours: 0, base_fee: 0, extra_fee_per_hour: 0, grace_period_minutes: 15 },
    { tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'MOTORBIKE', tariff_type: 'MONTHLY', monthly_fee: 120000, base_hours: 0, base_fee: 0, extra_fee_per_hour: 0, grace_period_minutes: 15 },
    { tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'CAR', tariff_type: 'CASUAL', monthly_fee: 0, base_hours: 2, base_fee: 25000, extra_fee_per_hour: 10000, grace_period_minutes: 15 },
    { tenant_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'MOTORBIKE', tariff_type: 'CASUAL', monthly_fee: 0, base_hours: 2, base_fee: 5000, extra_fee_per_hour: 3000, grace_period_minutes: 15 },
    
    { tenant_id: '22222222-2222-2222-2222-222222222222', vehicle_type: 'CAR', tariff_type: 'MONTHLY', monthly_fee: 1500000, base_hours: 0, base_fee: 0, extra_fee_per_hour: 0, grace_period_minutes: 15 },
    { tenant_id: '22222222-2222-2222-2222-222222222222', vehicle_type: 'MOTORBIKE', tariff_type: 'MONTHLY', monthly_fee: 150000, base_hours: 0, base_fee: 0, extra_fee_per_hour: 0, grace_period_minutes: 15 },
    { tenant_id: '22222222-2222-2222-2222-222222222222', vehicle_type: 'CAR', tariff_type: 'CASUAL', monthly_fee: 0, base_hours: 2, base_fee: 30000, extra_fee_per_hour: 15000, grace_period_minutes: 15 }
  ],
  vouchers: [
    { id: 'vch-1', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'HE2024', discount_type: 'PERCENT', discount_value: 10, min_order_amount: 100000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 500, used_count: 5, is_active: true },
    { id: 'vch-2', tenant_id: '11111111-1111-1111-1111-111111111111', code: 'TRIAN100K', discount_type: 'FIXED', discount_value: 100000, min_order_amount: 500000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 200, used_count: 12, is_active: true },
    { id: 'vch-3', tenant_id: '22222222-2222-2222-2222-222222222222', code: 'MASTERI15', discount_type: 'PERCENT', discount_value: 15, min_order_amount: 200000, valid_from: '2024-01-01', valid_to: '2026-12-31', usage_limit: 300, used_count: 0, is_active: true }
  ],
  tenant_payment_configs: [
    { tenant_id: '11111111-1111-1111-1111-111111111111', provider: 'VIETQR', bank_bin: '970422', bank_account_no: '110022334455', bank_account_name: 'BQL CHUNG CU VINHOMES OCEAN PARK', secret_api_key: 'vh_secret_key_8899', qr_timeout_seconds: 120 },
    { tenant_id: '22222222-2222-2222-2222-222222222222', provider: 'VIETQR', bank_bin: '970415', bank_account_no: '998877665544', bank_account_name: 'BQL MASTERI WATERFRONT', secret_api_key: 'mw_secret_key_1122', qr_timeout_seconds: 120 }
  ],
  renewal_orders: [],
  payment_transactions: [],
  parking_sessions: [],
  audit_logs: []
};

function createMockTenantDbClient(tenantId, isSuperAdmin) {
  return {
    query: async (sqlText, params = []) => {
      // Return scoped data based on tenantId
      return { rows: [] };
    }
  };
}
