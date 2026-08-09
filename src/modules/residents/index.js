/**
 * PARKING.GO Residents Directory Module
 */

import { initVehicleSearchModule } from '#modules/vehicle-search/index.js';

export function initResidentsModule(container) {
  if (!container) return;
  initVehicleSearchModule(container);
}
