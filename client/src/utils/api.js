const API_BASE = '/api';

// Helper to retrieve auth token
const getToken = () => {
  return localStorage.getItem('vibesafe_token');
};

// Generic fetch wrapper
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // If unauthorized on a protected route, don't clear token immediately during dev testing
      // but return structured error
      const data = await res.json().catch(() => ({ error: 'Unauthorized' }));
      throw new Error(data.error || 'Authentication required');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    throw err;
  }
};

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    me: () => request('/auth/me'),
  },

  // Devices
  devices: {
    getAll: () => request('/devices'),
    getById: (id) => request(`/devices/${id}`),
    create: (deviceData) => request('/devices', { method: 'POST', body: JSON.stringify(deviceData) }),
    update: (id, updates) => request(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) => request(`/devices/${id}`, { method: 'DELETE' }),
    regenerateKey: (id) => request(`/devices/${id}/regenerate-key`, { method: 'POST' }),
  },

  // Alerts
  alerts: {
    getAll: (params = '') => request(`/alerts${params ? `?${params}` : ''}`),
    getActive: () => request('/alerts/active'),
    getById: (id) => request(`/alerts/${id}`),
    acknowledge: (id, notes = '') => request(`/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ notes }) }),
    respond: (id, notes = '') => request(`/alerts/${id}/respond`, { method: 'POST', body: JSON.stringify({ notes }) }),
    resolve: (id, resolutionType, notes) => request(`/alerts/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolutionType, notes }) }),
    addNote: (id, note) => request(`/alerts/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
    exportCsvUrl: () => `${API_BASE}/alerts/export/csv`,
  },

  // Hardware / Simulator API (Direct REST endpoints with x-device-key)
  simulator: {
    triggerSos: async (apiKey, payload) => {
      const res = await fetch(`${API_BASE}/v1/devices/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': apiKey,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to trigger SOS' }));
        throw new Error(err.error || 'SOS Trigger Failed');
      }
      return await res.json();
    },

    sendHeartbeat: async (apiKey, payload) => {
      const res = await fetch(`${API_BASE}/v1/devices/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': apiKey,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to send heartbeat' }));
        throw new Error(err.error || 'Heartbeat Failed');
      }
      return await res.json();
    },

    cancelSos: async (apiKey) => {
      const res = await fetch(`${API_BASE}/v1/devices/cancel-sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': apiKey,
        },
      });
      return await res.json();
    },
  },
};
