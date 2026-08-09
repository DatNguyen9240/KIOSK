/**
 * PARKING.GO Settings Module
 */

import { initKioskTouchModule } from '../kiosk/index.js';

export function initSettingsModule(container) {
  if (!container) return;
  initKioskTouchModule(container);
}
