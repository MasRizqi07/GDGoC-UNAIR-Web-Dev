import { TodoSchema, UserSchema } from '@gdgoc/contracts';

const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function apiClient(endpoint, options = {}, isRetry = false) {
  try {
    const url = `${API_BASE}${endpoint}`;
    let res = await fetchWithTimeout(url, options);

    if (res.status === 401 && !isRetry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      // Try to refresh token
      const refreshRes = await fetchWithTimeout(`${API_BASE}/auth/refresh`, { method: 'POST' });
      if (refreshRes.ok) {
        // Retry original request
        res = await fetchWithTimeout(url, options);
      } else {
        // Refresh failed, user is logged out
        document.dispatchEvent(new CustomEvent('auth:logout'));
        throw new ApiError('Session expired', 401);
      }
    }

    if (!res.ok) {
      let errData;
      try {
        errData = await res.json();
      } catch (e) {
        errData = { message: res.statusText };
      }
      throw new ApiError(errData.message || 'API Error', res.status, errData);
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 408);
    }
    if (err instanceof TypeError) {
      throw new ApiError('Network error. You might be offline.', 0);
    }
    throw err;
  }
}

export const api = {
  auth: {
    async login(email, password) {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return UserSchema.parse(data.user || data);
    },
    async register(email, password) {
      const data = await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return UserSchema.parse(data.user || data);
    },
    async logout() {
      await apiClient('/auth/logout', { method: 'POST' });
      document.dispatchEvent(new CustomEvent('auth:logout'));
    },
    async me() {
      try {
        const data = await apiClient('/auth/me');
        if (!data) return null;
        return UserSchema.parse(data);
      } catch (e) {
        if (e.status === 401) return null;
        throw e;
      }
    }
  },
  todos: {
    async list() {
      const data = await apiClient('/todos');
      return data.map(todo => TodoSchema.parse(todo));
    },
    async create(text) {
      const data = await apiClient('/todos', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      return TodoSchema.parse(data);
    },
    async update(id, updates) {
      const data = await apiClient(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return TodoSchema.parse(data);
    },
    async remove(id) {
      await apiClient(`/todos/${id}`, { method: 'DELETE' });
    }
  },
  preferences: {
    async get() {
      return await apiClient('/preferences');
    },
    async updateTheme(theme) {
      return await apiClient('/preferences', {
        method: 'PUT',
        body: JSON.stringify({ theme })
      });
    }
  },
  progress: {
    async list() {
      return await apiClient('/progress');
    },
    async update(tutorialId, completed) {
      return await apiClient(`/progress/${tutorialId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed })
      });
    }
  }
};
