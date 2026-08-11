/**
 * PARKING System Configuration
 * Fully integrated with Real Express/NestJS Backend API
 */

// Automatically switch to mock mode if running on common static dev ports (like VS Code Live Server 5500)
// to prevent red console errors from failed API fetch requests.
const isLocalStaticServer = typeof window !== 'undefined' && 
  window.location.port !== '' && 
  window.location.port !== '3000';

export const CONFIG = Object.freeze({
  API_BASE_URL: '/api',
  REQUEST_TIMEOUT_MS: 15000,
  MOCK_MODE: isLocalStaticServer, // Auto-toggle mock mode on static dev servers
  APP_NAME: 'PARKING',
  DEFAULT_PAGE_SIZE: 10,
  QR_REFRESH_INTERVAL_MS: 120000
});
