/**
 * Authentication Service & JWT Token Manager
 */

import { apiRequest } from '../core/api.js';
import { MOCK_USERS } from '../core/mock-data.js';

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
    console.warn('[AuthService] Live API login failed, checking frontend mock database:', err.message);
  }

  // Frontend Fallback Mock Mode (For static servers like Live Server port 5500)
  const normEmail = email.toLowerCase().trim();
  let mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === normEmail);
  
  // Add resident mock credential fallback
  if (!mockUser && normEmail === 'tuan.tv@gmail.com') {
    mockUser = { id: 'a9999999-9999-9999-9999-999999999999', email: 'tuan.tv@gmail.com', fullName: 'Trần Văn Tuấn', isSuperAdmin: false };
  }

  const expectedPassword = normEmail.includes('superadmin') ? 'superadmin' : 'admin';

  if (mockUser && password === expectedPassword) {
    const mockData = {
      token: `mock-jwt-token-for-${mockUser.email}-${Date.now()}`,
      user: mockUser
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('parking_go_jwt_token', mockData.token);
      localStorage.setItem('parking_go_user', JSON.stringify(mockData.user));
    }
    return mockData;
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
