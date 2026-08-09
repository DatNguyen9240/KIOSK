/**
 * PARKING.GO Vehicle Access Log Module
 */

import { initVehicleSearchModule } from '../vehicle-search/index.js';

export function initVehicleAccessModule(container) {
  if (!container) return;
  initVehicleSearchModule(container);
}
