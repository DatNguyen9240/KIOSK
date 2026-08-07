/**
 * Core API Layer Abstraction
 */

import { CONFIG } from './config.js';

export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    params = null,
    signal = null
  } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams(params).toString();
    url += (url.includes('?') ? '&' : '?') + query;
  }

  const reqHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers
  };

  const reqConfig = {
    method,
    headers: reqHeaders,
    signal
  };

  if (body && method !== 'GET') {
    reqConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, reqConfig);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request cancelled');
    }
    console.error(`[API Error] ${method} ${url}:`, err);
    throw err;
  }
}
