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
};
