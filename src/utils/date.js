/**
 * Date & Time Utilities
 */

export function formatDate(dateInput) {
  if (!dateInput) return '--/--/----';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '--/--/----';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '--/--/---- --:--';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '--/--/---- --:--';

  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Calculates remaining seconds using absolute timestamp comparisons (resilient to tab lags)
 */
export function getRemainingSeconds(expiresAtTimestamp) {
  if (!expiresAtTimestamp) return 0;
  const now = Date.now();
  const diffMs = expiresAtTimestamp - now;
  return Math.max(0, Math.floor(diffMs / 1000));
}

export function formatCountdown(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}
