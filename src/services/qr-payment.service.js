/**
 * 120s Dynamic QR Payment & Countdown Timer Service
 */

import { apiRequest } from '../core/api.js';
import { CONFIG } from '../core/config.js';
import { QR_COUNTDOWN_SECONDS, PAYMENT_STATUS } from '../core/constants.js';
import { getRemainingSeconds } from '../utils/date.js';

let activeTimerInterval = null;

export async function createQrPaymentTransaction(paymentData) {
  if (CONFIG.MOCK_MODE) {
    await new Promise(res => setTimeout(res, 300));
    const now = Date.now();
    const expiresAt = now + (QR_COUNTDOWN_SECONDS * 1000);
    const transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

    // Mock VietQR / E-wallet QR Payload URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PARKING_GO_${transactionId}_AMOUNT_${paymentData.finalAmount || 50000}`;

    return {
      success: true,
      transactionId,
      qrUrl,
      amount: paymentData.finalAmount || 50000,
      expiresAt,
      status: PAYMENT_STATUS.WAITING_PAYMENT,
      createdAt: new Date().toISOString()
    };
  }

  return apiRequest('/payment/create-qr', { method: 'POST', body: paymentData });
}

export function startQrCountdownTimer(expiresAtTimestamp, onTick, onExpire) {
  stopQrCountdownTimer();

  const update = () => {
    const remaining = getRemainingSeconds(expiresAtTimestamp);
    if (remaining <= 0) {
      stopQrCountdownTimer();
      if (typeof onExpire === 'function') onExpire();
    } else {
      if (typeof onTick === 'function') onTick(remaining);
    }
  };

  update(); // Initial tick
  activeTimerInterval = setInterval(update, 1000);
}

export function stopQrCountdownTimer() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
}

export async function checkPaymentStatus(transactionId) {
  if (CONFIG.MOCK_MODE) {
    // Return waiting status in mock mode
    return {
      transactionId,
      status: PAYMENT_STATUS.WAITING_PAYMENT
    };
  }

  return apiRequest(`/payment/status/${transactionId}`);
}
