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
    console.warn('[AuthService] Login failed:', err.message);
  }
  return null;
}

export function isAuthenticated() {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem('parking_go_jwt_token');
}

export function getCurrentUser() {
  if (typeof localStorage === 'undefined') return null;
  const userStr = localStorage.getItem('parking_go_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('parking_go_jwt_token');
    localStorage.removeItem('parking_go_user');
  }
  window.location.hash = '#/login';
}
