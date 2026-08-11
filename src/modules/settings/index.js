/**
 * PARKING Settings Module
 */

import { initKioskTouchModule } from '#modules/kiosk/index.js';

export function initSettingsModule(container) {
  if (!container) return;
  initKioskTouchModule(container);
}
