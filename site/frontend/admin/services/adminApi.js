const ADMIN_TOKEN_KEY = 'foodexpress_admin_token';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getStoredAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredAdminToken(token) {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // Ignora falha de localStorage
  }
}

export async function requestJson(path, options = {}) {
  const token = getStoredAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(
      data?.error?.message || `Erro HTTP ${response.status} ao acessar ${path}`
    );
    err.status = response.status;
    err.code = data?.error?.code || 'HTTP_ERROR';
    throw err;
  }

  return data;
}

export const adminApi = {
  async login(username, password) {
    const data = await requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      setStoredAdminToken(data.token);
    }
    return data;
  },

  async withAuth(fn) {
    const current = getStoredAdminToken();
    if (!current || current.split('.').length !== 3) {
      setStoredAdminToken('');
      const err = new Error('Sessão administrativa expirada ou ausente. Faça login novamente.');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    try {
      return await fn();
    } catch (err) {
      if (err.status === 401) {
        setStoredAdminToken('');
      }
      throw err;
    }
  },

  // Pedidos Admin (API-009, API-010, API-011)
  async fetchOrders(status = null) {
    return this.withAuth(() => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      return requestJson(`/admin/orders${qs}`, { method: 'GET' });
    });
  },

  async fetchMetrics(period = 'today') {
    return this.withAuth(() => {
      const qs = period ? `?period=${encodeURIComponent(period)}` : '';
      return requestJson(`/admin/metrics${qs}`, { method: 'GET' });
    });
  },

  async advanceOrder(orderId, targetStatus = null) {
    return this.withAuth(() =>
      requestJson(`/admin/orders/${orderId}/advance`, {
        method: 'PATCH',
        body: JSON.stringify(targetStatus ? { targetStatus } : {}),
      })
    );
  },

  async cancelOrder(orderId) {
    return this.withAuth(() =>
      requestJson(`/admin/orders/${orderId}/cancel`, {
        method: 'POST',
      })
    );
  },

  // Cardápio Admin (API-006, API-007, API-008)
  async fetchAdminMenu() {
    return this.withAuth(() =>
      requestJson('/admin/menu', { method: 'GET' })
    );
  },

  async createCategory(payload) {
    return this.withAuth(() =>
      requestJson('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  },

  async updateCategory(id, payload) {
    return this.withAuth(() =>
      requestJson(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  },

  async toggleCategoryActive(id, active = undefined) {
    return this.withAuth(() =>
      requestJson(`/admin/categories/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify(active !== undefined ? { active } : {}),
      })
    );
  },

  async deleteCategory(id) {
    return this.withAuth(() =>
      requestJson(`/admin/categories/${id}`, {
        method: 'DELETE',
      })
    );
  },

  async createProduct(payload) {
    return this.withAuth(() =>
      requestJson('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  },

  async updateProduct(id, payload) {
    return this.withAuth(() =>
      requestJson(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  },

  async toggleProductActive(id, active = undefined) {
    return this.withAuth(() =>
      requestJson(`/admin/products/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify(active !== undefined ? { active } : {}),
      })
    );
  },

  async deleteProduct(id) {
    return this.withAuth(() =>
      requestJson(`/admin/products/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // Gestão de Usuários e Acessos ao Sistema (SQLite)
  async fetchUsers() {
    return this.withAuth(() =>
      requestJson('/admin/users', { method: 'GET' })
    );
  },

  async createUser(payload) {
    return this.withAuth(() =>
      requestJson('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  },

  async updateUser(id, payload) {
    return this.withAuth(() =>
      requestJson(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  },

  async toggleUserActive(id) {
    return this.withAuth(() =>
      requestJson(`/admin/users/${id}/toggle`, {
        method: 'PATCH',
      })
    );
  },

  async deleteUser(id) {
    return this.withAuth(() =>
      requestJson(`/admin/users/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // Gestão de Banners do Hero (Carrossel Inicial)
  async fetchPublicBanners() {
    return requestJson('/public/banners', { method: 'GET' });
  },

  async fetchBanners() {
    return this.withAuth(() =>
      requestJson('/admin/banners', { method: 'GET' })
    );
  },

  async createBanner(payload) {
    return this.withAuth(() =>
      requestJson('/admin/banners', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  },

  async updateBanner(id, payload) {
    return this.withAuth(() =>
      requestJson(`/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  },

  async toggleBannerActive(id, active = undefined) {
    return this.withAuth(() =>
      requestJson(`/admin/banners/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify(active !== undefined ? { active } : {}),
      })
    );
  },

  async deleteBanner(id) {
    return this.withAuth(() =>
      requestJson(`/admin/banners/${id}`, {
        method: 'DELETE',
      })
    );
  },

  async resetDefaultBanners() {
    return this.withAuth(() =>
      requestJson('/admin/banners/reset-defaults', {
        method: 'POST',
      })
    );
  },
};
