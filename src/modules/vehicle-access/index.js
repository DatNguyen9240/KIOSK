/**
 * PARKING Vehicle Access Log Module
 */

import { initVehicleSearchModule } from '#modules/vehicle-search/index.js';

export function initVehicleAccessModule(container) {
  if (!container) return;
  initVehicleSearchModule(container);
}
