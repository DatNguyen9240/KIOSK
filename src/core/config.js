/**
 * PARKING.GO System Configuration
 * Fully integrated with Real Express/NestJS Backend API
 */

export const CONFIG = Object.freeze({
  API_BASE_URL: '/api',
  REQUEST_TIMEOUT_MS: 15000,
  MOCK_MODE: false, // Set to false to execute real Backend REST API endpoints
  APP_NAME: 'PARKING.GO',
  DEFAULT_PAGE_SIZE: 10,
  QR_REFRESH_INTERVAL_MS: 120000
});
