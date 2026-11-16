import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { MOCK_ORDERS } from '../data/mockData';
import { adminApi, getStoredAdminToken, publicApi } from '../services/api';

const OrderContext = createContext(null);

const ORDERS_STORAGE_KEY = 'foodexpress_orders';
const LAST_ORDER_KEY = 'foodexpress_last_order_id';

function loadInitialOrders() {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_ORDERS;
  } catch {
    return MOCK_ORDERS;
  }
}

export function OrderProvider({ children }) {
  const [adminOrders, setAdminOrders] = useState(loadInitialOrders);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(() =>
    localStorage.getItem(LAST_ORDER_KEY)
  );

  // Carrega pedidos reais do backend SQLite apenas se o atendente já tiver sessão autenticada
  useEffect(() => {
    let isMounted = true;
    const token = getStoredAdminToken();
    if (token && token.split('.').length === 3) {
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
    }

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

  const upsertOrderInState = useCallback((orderObj) => {
    if (!orderObj || !orderObj.id) return;
    setCurrentOrder((prev) =>
      !prev || Number(prev.id) === Number(orderObj.id) ? orderObj : prev
    );
    setAdminOrders((prev) => {
      const exists = prev.some((o) => Number(o.id) === Number(orderObj.id));
      if (exists) {
        return prev.map((o) =>
          Number(o.id) === Number(orderObj.id) ? orderObj : o
        );
      }
      return [orderObj, ...prev];
    });
  }, []);

  const createOrder = useCallback(async (orderData) => {
    const tempId = Date.now() % 100000;
    const optimisticOrder = {
      id: tempId,
      ...orderData,
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persistência prioritária no Backend SQLite
    try {
      const response = await publicApi.createOrder({
        orderType:
          orderData.orderType || (orderData.tableNumber ? 'DINE_IN' : 'DELIVERY'),
        customerName:
          orderData.customerName ||
          (orderData.deliveryAddress ? 'Cliente FoodExpress' : null),
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
        setAdminOrders((prev) => [
          persistedOrder,
          ...prev.filter((o) => Number(o.id) !== Number(persistedOrder.id)),
        ]);
        const idStr = String(persistedOrder.id);
        localStorage.setItem(LAST_ORDER_KEY, idStr);
        setLastOrderId(idStr);
        return persistedOrder;
      }
    } catch (err) {
      if (err.status === 422 || err.status === 400) {
        throw err;
      }
      console.warn('Backend indisponível ao salvar pedido, mantendo local:', err);
    }

    // Fallback offline caso o servidor não esteja rodando
    setCurrentOrder(optimisticOrder);
    setAdminOrders((prev) => [optimisticOrder, ...prev]);
    const idStr = String(optimisticOrder.id);
    localStorage.setItem(LAST_ORDER_KEY, idStr);
    setLastOrderId(idStr);
    return optimisticOrder;
  }, []);

  const getOrder = useCallback(
    (orderId) => {
      const numericId = Number(orderId);
      if (!numericId) return null;
      return adminOrders.find((o) => Number(o.id) === numericId) || null;
    },
    [adminOrders]
  );

  const fetchOrderById = useCallback(
    async (orderId) => {
      const numericId = Number(orderId);
      if (!numericId) return null;
      try {
        const data = await publicApi.getOrder(numericId);
        if (data?.order) {
          upsertOrderInState(data.order);
          return data.order;
        }
      } catch {
        // Fallback para estado em memória
      }
      return adminOrders.find((o) => Number(o.id) === numericId) || null;
    },
    [adminOrders, upsertOrderInState]
  );

  const advanceOrderStatus = useCallback(
    async (orderId, targetStatus) => {
      try {
        const res = await adminApi.advanceOrder(orderId, targetStatus);
        if (res?.order) {
          upsertOrderInState(res.order);
          return res.order;
        }
      } catch {
        // Fallback local
      }

      setAdminOrders((prev) =>
        prev.map((order) =>
          Number(order.id) === Number(orderId)
            ? { ...order, status: targetStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );
      setCurrentOrder((prev) =>
        prev && Number(prev.id) === Number(orderId)
          ? { ...prev, status: targetStatus, updatedAt: new Date().toISOString() }
          : prev
      );
    },
    [upsertOrderInState]
  );

  const cancelOrder = useCallback(
    async (orderId, byAdmin = false) => {
      try {
        const res = byAdmin
          ? await adminApi.cancelOrder(orderId)
          : await publicApi.cancelOrder(orderId);
        if (res?.order) {
          upsertOrderInState(res.order);
          return res.order;
        }
      } catch (err) {
        if (err.status === 422) {
          throw err;
        }
        // Fallback local apenas se rede indisponível
      }

      setAdminOrders((prev) =>
        prev.map((order) =>
          Number(order.id) === Number(orderId)
            ? { ...order, status: 'CANCELLED', updatedAt: new Date().toISOString() }
            : order
        )
      );
      setCurrentOrder((prev) =>
        prev && Number(prev.id) === Number(orderId)
          ? { ...prev, status: 'CANCELLED', updatedAt: new Date().toISOString() }
          : prev
      );
    },
    [upsertOrderInState]
  );

  const markOrderAsPaid = useCallback(
    async (orderId, paymentMethod = 'PIX') => {
      try {
        const res = await publicApi.markOrderAsPaid(orderId, paymentMethod);
        if (res?.order) {
          upsertOrderInState(res.order);
          return res.order;
        }
      } catch {
        // Fallback local
      }

      setAdminOrders((prev) =>
        prev.map((order) =>
          Number(order.id) === Number(orderId)
            ? {
                ...order,
                isPaid: true,
                paymentMethod,
                paidAt: new Date().toISOString(),
              }
            : order
        )
      );
      setCurrentOrder((prev) =>
        prev && Number(prev.id) === Number(orderId)
          ? {
              ...prev,
              isPaid: true,
              paymentMethod,
              paidAt: new Date().toISOString(),
            }
          : prev
      );
    },
    [upsertOrderInState]
  );

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        setCurrentOrder,
        adminOrders,
        setAdminOrders,
        createOrder,
        getOrder,
        fetchOrderById,
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
