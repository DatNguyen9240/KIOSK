/**
 * String & Input Formatter Utility
 */

export function normalizePlateNumber(plate) {
  if (!plate) return '';
  return plate
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

export function formatPlateDisplay(plate) {
  if (!plate) return '';
  const raw = normalizePlateNumber(plate);
  if (raw.length >= 7) {
    return `${raw.slice(0, 3)}-${raw.slice(3, 6)}.${raw.slice(6)}`;
  }
  return raw;
}
