const API_BASE = '/api';

const getToken = () => localStorage.getItem('ff_token');

const setToken = (token) => {
  if (token) localStorage.setItem('ff_token', token);
  else localStorage.removeItem('ff_token');
};

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (data.success === false) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }

  if (!res.ok && res.status !== 409) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data.data;
    throw err;
  }

  return { data: data.data, message: data.message, status: res.status };
}

export const authApi = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
};

export const itemsApi = {
  list: () => apiRequest('/items'),
  get: (id) => apiRequest(`/items/${id}`),
  create: (body) => apiRequest('/items', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiRequest(`/items/${id}`, { method: 'DELETE' }),
  finish: (id) => apiRequest(`/items/${id}/finish`, { method: 'PATCH' }),
};

export const ordersApi = {
  list: (status) => apiRequest(`/orders${status ? `?status=${status}` : ''}`),
  reorderList: () => apiRequest('/orders/reorder'),
  create: (body) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(body) }),
  send: (id, body) => apiRequest(`/orders/${id}/send`, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  confirm: (id) => apiRequest(`/orders/${id}/confirm`, { method: 'PATCH' }),
  sendBatch: (body) => apiRequest('/orders/send-batch', { method: 'POST', body: JSON.stringify(body) }),
  reorderSame: (body) => apiRequest('/orders/reorder-same', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),
};

export const transactionsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/transactions${qs ? `?${qs}` : ''}`);
  },
  summary: (month, year) => {
    const qs = new URLSearchParams({ month, year }).toString();
    return apiRequest(`/transactions/summary?${qs}`);
  },
};

export const dashboardApi = {
  get: () => apiRequest('/dashboard'),
};

export const openFoodFactsApi = {
  search: async (query) => {
    const result = await apiRequest(`/openfoodfacts/search?q=${encodeURIComponent(query)}`);
    return result.data;
  },
  lookupBarcode: async (code) => {
    const result = await apiRequest(`/openfoodfacts/barcode/${encodeURIComponent(code)}`);
    return result.data;
  },
};

export const exchangeRateApi = {
  convert: async (base, target, amount = 1) => {
    const result = await apiRequest(`/exchange-rate/convert?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}&amount=${encodeURIComponent(amount)}`);
    return result.data;
  },
};

export const usersApi = {
  updateProfile: (body) => apiRequest('/users/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  updateBudget: (budget) => apiRequest('/users/budget', { method: 'PATCH', body: JSON.stringify({ budget }) }),
  updateNotifications: (body) => apiRequest('/users/notifications', { method: 'PATCH', body: JSON.stringify(body) }),
  addVendor: (body) => apiRequest('/users/vendors', { method: 'POST', body: JSON.stringify(body) }),
  updateVendor: (id, body) => apiRequest(`/users/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeVendor: (id) => apiRequest(`/users/vendors/${id}`, { method: 'DELETE' }),
  resetThresholds: () => apiRequest('/users/thresholds/reset', { method: 'POST' }),
  deleteAccount: () => apiRequest('/users/account', { method: 'DELETE' }),
};

export const recurringApi = {
  list: () => apiRequest('/recurring'),
  suggestions: () => apiRequest('/recurring/suggestions'),
  create: (body) => apiRequest('/recurring', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/recurring/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  trigger: () => apiRequest('/recurring/trigger', { method: 'POST' }),
};

export { getToken, setToken };
