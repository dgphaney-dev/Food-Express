import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { MOCK_ORDERS } from '../data/mockData';
import { adminApi, publicApi } from '../services/api';

const OrderContext = createContext(null);

const ORDERS_STORAGE_KEY = 'foodexpress_orders';
const LAST_ORDER_KEY = 'foodexpress_last_order_id';

function loadInitialOrders() {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  } catch {
    return MOCK_ORDERS;
  }
}

export function OrderProvider({ children }) {
  const [adminOrders, setAdminOrders] = useState(loadInitialOrders);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Carrega pedidos reais do backend SQLite ao inicializar
  useEffect(() => {
    let isMounted = true;
    adminApi
      .fetchOrders()
      .then((data) => {
        if (isMounted && data?.orders && data.orders.length > 0) {
          setAdminOrders(data.orders);
        }
      })
      .catch(() => {
        // Modo offline / mock fallback
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync orders to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(adminOrders));
    } catch {
      // Storage full or unavailable
    }
  }, [adminOrders]);

  const createOrder = useCallback(async (orderData) => {
    const tempId = Date.now() % 100000;
    const optimisticOrder = {
      id: tempId,
      ...orderData,
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Atualização otimista imediata para feedback instantâneo na UI
    setCurrentOrder(optimisticOrder);
    setAdminOrders((prev) => [optimisticOrder, ...prev]);
    localStorage.setItem(LAST_ORDER_KEY, String(optimisticOrder.id));

    // Persistência no Backend SQLite
    try {
      const response = await publicApi.createOrder({
        orderType: orderData.orderType || (orderData.tableNumber ? 'DINE_IN' : 'DELIVERY'),
        customerName: orderData.customerName || (orderData.deliveryAddress ? 'Cliente FoodExpress' : null),
        customerPhone: orderData.customerPhone || null,
        deliveryAddress: orderData.deliveryAddress || null,
        tableNumber: orderData.tableNumber || null,
        paymentMethod: orderData.paymentMethod || 'PIX',
        isPaid: Boolean(orderData.isPaid),
        deliveryPin: orderData.deliveryPin || '8492',
        totalAmount: Number(orderData.totalPrice || orderData.totalAmount || 0),
        items: orderData.items || [],
      });

      if (response?.order) {
        const persistedOrder = response.order;
        setCurrentOrder(persistedOrder);
        setAdminOrders((prev) =>
          prev.map((o) => (o.id === tempId ? persistedOrder : o))
        );
        localStorage.setItem(LAST_ORDER_KEY, String(persistedOrder.id));
        return persistedOrder;
      }
    } catch (err) {
      console.warn('Backend indisponível ao salvar pedido, mantendo local:', err);
    }

    return optimisticOrder;
  }, []);

  const getOrder = useCallback((orderId) => {
    const numericId = Number(orderId);
    const local = adminOrders.find((o) => o.id === numericId);

    // Consulta em background ao backend para atualizar status
    if (numericId) {
      publicApi
        .getOrder(numericId)
        .then((data) => {
          if (data?.order) {
            setAdminOrders((prev) =>
              prev.map((o) => (o.id === numericId ? data.order : o))
            );
          }
        })
        .catch(() => {});
    }

    return local || null;
  }, [adminOrders]);

  const advanceOrderStatus = useCallback((orderId, targetStatus) => {
    setAdminOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: targetStatus, updatedAt: new Date().toISOString() }
          : order
      )
    );
    setCurrentOrder((prev) =>
      prev && prev.id === orderId
        ? { ...prev, status: targetStatus, updatedAt: new Date().toISOString() }
        : prev
    );

    adminApi.advanceOrder(orderId, targetStatus).catch(() => {});
  }, []);

  const cancelOrder = useCallback((orderId) => {
    setAdminOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: 'CANCELLED', updatedAt: new Date().toISOString() }
          : order
      )
    );
    setCurrentOrder((prev) =>
      prev && prev.id === orderId
        ? { ...prev, status: 'CANCELLED', updatedAt: new Date().toISOString() }
        : prev
    );

    publicApi.cancelOrder(orderId).catch(() => {
      adminApi.cancelOrder(orderId).catch(() => {});
    });
  }, []);

  const markOrderAsPaid = useCallback((orderId, paymentMethod = 'PIX') => {
    setAdminOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, isPaid: true, paymentMethod, paidAt: new Date().toISOString() }
          : order
      )
    );
    setCurrentOrder((prev) =>
      prev && prev.id === orderId
        ? { ...prev, isPaid: true, paymentMethod, paidAt: new Date().toISOString() }
        : prev
    );

    publicApi.markOrderAsPaid(orderId, paymentMethod).catch(() => {});
  }, []);

  const lastOrderId = localStorage.getItem(LAST_ORDER_KEY);

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        setCurrentOrder,
        adminOrders,
        setAdminOrders,
        createOrder,
        getOrder,
        advanceOrderStatus,
        cancelOrder,
        markOrderAsPaid,
        lastOrderId,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
