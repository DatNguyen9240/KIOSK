/**
 * Authentication Service & JWT Token Manager
 */

import { apiRequest } from '../core/api.js';

export async function login(email = 'admin@vinhomes.vn', password = 'admin') {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (res && res.success && res.data?.token) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('parking_go_jwt_token', res.data.token);
        localStorage.setItem('parking_go_user', JSON.stringify(res.data.user));
      }
      return res.data;
    }
  } catch (err) {
    console.warn('[AuthService] Login failed, continuing:', err.message);
  }
  return null;
}

export async function ensureAuthenticated() {
  if (typeof localStorage === 'undefined') return;
  const existingToken = localStorage.getItem('parking_go_jwt_token');
  if (!existingToken) {
    console.log('[Auth] Initializing auto-session for tenant admin...');
    await login('admin@vinhomes.vn', 'admin');
  }
}
