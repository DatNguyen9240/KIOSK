/**
 * PARKING.GO System Constants
 */

export const PAYMENT_STATUS = Object.freeze({
  INITIAL: 'INITIAL',
  CREATING_PAYMENT: 'CREATING_PAYMENT',
  WAITING_PAYMENT: 'WAITING_PAYMENT',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFRESHING_QR: 'REFRESHING_QR'
});

export const VEHICLE_TYPES = Object.freeze({
  CAR: { id: 'CAR', name: 'Ô tô', icon: '🚗' },
  MOTORBIKE: { id: 'MOTORBIKE', name: 'Xe máy', icon: '🛵' },
  BICYCLE: { id: 'BICYCLE', name: 'Xe đạp', icon: '🚲' },
  ELECTRIC_BIKE: { id: 'ELECTRIC_BIKE', name: 'Xe máy điện', icon: '⚡' }
});

export const DEFAULT_TOWERS = Object.freeze([
  { id: 'ALL', name: 'Tất cả tháp' },
  { id: 'A1', name: 'Tháp A1' },
  { id: 'A2', name: 'Tháp A2' },
  { id: 'A3', name: 'Tháp A3' },
  { id: 'B1', name: 'Tháp B1' }
]);

export const QR_COUNTDOWN_SECONDS = 120;
export const SEARCH_DEBOUNCE_MS = 300;
