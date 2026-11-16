import { asc, desc, eq } from 'drizzle-orm';
import { getDb, getSqlite } from '../../db/connection.js';
import { orderItems, orders } from '../../db/schema.js';

function hydrateOrders(orderRows) {
  if (orderRows.length === 0) return [];
  const db = getDb();
  const allItems = db
    .select()
    .from(orderItems)
    .orderBy(asc(orderItems.id))
    .all();

  return orderRows.map((o) => {
    const items = allItems
      .filter((item) => item.orderId === o.id)
      .map((item) => {
        let addonsSnapshot = [];
        try {
          addonsSnapshot = JSON.parse(item.addonsJsonSnapshot || '[]');
        } catch {
          addonsSnapshot = [];
        }
        return {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          quantity: Number(item.quantity),
          variationNameSnapshot: item.variationNameSnapshot,
          addonsSnapshot,
          addonsJsonSnapshot: item.addonsJsonSnapshot || '[]',
          notes: item.notes || '',
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        };
      });

    return {
      id: o.id,
      orderType: o.orderType,
      status: o.status,
      tableNumber: o.tableNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress,
      paymentMethod: o.paymentMethod || 'PIX',
      isPaid: Boolean(o.isPaid),
      deliveryPin: o.deliveryPin || '8492',
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      items,
    };
  });
}

export const orderRepo = {
  findAll({ status = null } = {}) {
    const db = getDb();
    const rows = db
      .select()
      .from(orders)
      .orderBy(desc(orders.id))
      .all();

    const filtered = status
      ? status === 'ACTIVE'
        ? rows.filter((o) =>
            ['RECEIVED', 'PREPARING', 'READY'].includes(o.status)
          )
        : rows.filter((o) => o.status === status)
      : rows;

    return hydrateOrders(filtered);
  },

  findById(id) {
    const db = getDb();
    const row = db
      .select()
      .from(orders)
      .where(eq(orders.id, Number(id)))
      .get();
    if (!row) return null;
    return hydrateOrders([row])[0] || null;
  },

  createWithItems(orderData, itemsList) {
    const db = getDb();
    const sqlite = getSqlite();

    const tx = sqlite.transaction(() => {
      const now = new Date().toISOString();
      const insertedOrder = db
        .insert(orders)
        .values({
          ...(orderData.id ? { id: Number(orderData.id) } : {}),
          orderType: orderData.orderType,
          status: orderData.status || 'RECEIVED',
          tableNumber: orderData.tableNumber ?? null,
          customerName: orderData.customerName ?? null,
          customerPhone: orderData.customerPhone ?? null,
          deliveryAddress: orderData.deliveryAddress ?? null,
          paymentMethod: orderData.paymentMethod ?? 'PIX',
          isPaid: Boolean(orderData.isPaid),
          deliveryPin: orderData.deliveryPin ?? '8492',
          totalAmount: Number(orderData.totalAmount),
          createdAt: orderData.createdAt || now,
          updatedAt: orderData.updatedAt || now,
        })
        .returning()
        .get();

      for (const item of itemsList) {
        const serializedAddons =
          typeof item.addonsJsonSnapshot === 'string'
            ? item.addonsJsonSnapshot
            : JSON.stringify(item.addonsSnapshot || []);

        db.insert(orderItems)
          .values({
            orderId: insertedOrder.id,
            productId: item.productId ?? null,
            productNameSnapshot: item.productNameSnapshot,
            quantity: Number(item.quantity),
            variationNameSnapshot: item.variationNameSnapshot ?? null,
            addonsJsonSnapshot: serializedAddons,
            notes: item.notes || '',
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
          })
          .run();
      }

      return insertedOrder.id;
    });

    const newOrderId = tx();
    return this.findById(newOrderId);
  },

  updateStatus(id, status, updatedAt = new Date().toISOString()) {
    const db = getDb();
    db.update(orders)
      .set({ status, updatedAt })
      .where(eq(orders.id, Number(id)))
      .run();
    return this.findById(id);
  },

  markAsPaid(id, paymentMethod = 'PIX') {
    const db = getDb();
    const now = new Date().toISOString();
    db.update(orders)
      .set({ isPaid: true, paymentMethod, updatedAt: now })
      .where(eq(orders.id, Number(id)))
      .run();
    return this.findById(id);
  },

  getMetrics({ period = 'today' } = {}) {
    const all = this.findAll();

    const now = new Date();
    let startDate = null;

    if (period === 'today') {
      // Começo do dia de hoje (00:00:00 local)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      startDate = startOfToday.toISOString();
    } else if (period === '7days') {
      // 7 dias atrás
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = sevenDaysAgo.toISOString();
    } else if (period === 'month') {
      // Início do mês atual (ou últimos 30 dias)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      startDate = startOfMonth.toISOString();
    }

    const filtered = startDate
      ? all.filter((o) => (o.createdAt || '') >= startDate)
      : all;

    const totalOrders = filtered.length;
    const deliveredOrders = filtered.filter((o) => o.status === 'DELIVERED');
    const activeOrders = filtered.filter((o) =>
      ['RECEIVED', 'PREPARING', 'READY'].includes(o.status)
    );
    const cancelledOrders = filtered.filter((o) => o.status === 'CANCELLED');

    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
    const averageTicket =
      deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    const dineInOrders = filtered.filter((o) => o.orderType === 'DINE_IN').length;
    const deliveryOrders = filtered.filter((o) => o.orderType === 'DELIVERY').length;

    const statusCounts = {
      RECEIVED: filtered.filter((o) => o.status === 'RECEIVED').length,
      PREPARING: filtered.filter((o) => o.status === 'PREPARING').length,
      READY: filtered.filter((o) => o.status === 'READY').length,
      DELIVERED: deliveredOrders.length,
      CANCELLED: cancelledOrders.length,
    };

    const productStats = {};
    for (const ord of filtered) {
      for (const item of ord.items || []) {
        const name = item.productNameSnapshot || 'Item';
        if (!productStats[name]) {
          productStats[name] = { name, count: 0, revenue: 0 };
        }
        productStats[name].count += Number(item.quantity) || 1;
        productStats[name].revenue += Number(item.subtotal) || 0;
      }
    }

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      period,
      totalOrders,
      activeOrders: activeOrders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageTicket: Number(averageTicket.toFixed(2)),
      dineInOrders,
      deliveryOrders,
      statusCounts,
      topProducts,
      recentOrders: filtered.slice(0, 8),
      allOrdersCount: all.length,
      updatedAt: new Date().toISOString(),
    };
  },
};
