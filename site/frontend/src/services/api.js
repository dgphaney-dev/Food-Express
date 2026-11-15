import {
  adminApi,
  getStoredAdminToken,
  requestJson,
  setStoredAdminToken,
} from '../../admin/services/adminApi';

export { adminApi, getStoredAdminToken, setStoredAdminToken };

export const publicApi = {
  async getMenu() {
    return requestJson('/public/menu', { method: 'GET' });
  },

  async createOrder(payload) {
    return requestJson('/public/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOrder(orderId) {
    return requestJson(`/public/orders/${orderId}`, { method: 'GET' });
  },

  async markOrderAsPaid(orderId, paymentMethod = 'PIX') {
    return requestJson(`/public/orders/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  },

  async cancelOrder(orderId) {
    return requestJson(`/public/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  },
};

export const driverApi = {
  async listOrders() {
    return requestJson('/driver/orders', { method: 'GET' });
  },

  async confirmPin(orderId, pin) {
    return requestJson(`/driver/orders/${orderId}/confirm-pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },
};
