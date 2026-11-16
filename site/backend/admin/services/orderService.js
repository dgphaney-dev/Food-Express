import { AppError } from '../middlewares/errorHandler.js';
import { categoryRepo } from '../repositories/categoryRepo.js';
import { orderRepo } from '../repositories/orderRepo.js';
import { productRepo } from '../repositories/productRepo.js';
import { buildWhatsAppUrl, formatWhatsAppMessage } from './whatsappService.js';

export const ORDER_STATUS = {
  RECEIVED: 'RECEIVED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/**
 * RN-006 / TR-009: Mapa estrito da Máquina de Estados Finita (FSM) linear
 * Recebido -> Em preparo -> Pronto -> Entregue
 */
export const NEXT_STATUS_MAP = {
  [ORDER_STATUS.RECEIVED]: ORDER_STATUS.PREPARING,
  [ORDER_STATUS.PREPARING]: ORDER_STATUS.READY,
  [ORDER_STATUS.READY]: ORDER_STATUS.DELIVERED,
  [ORDER_STATUS.DELIVERED]: null,
  [ORDER_STATUS.CANCELLED]: null,
};

export const CUSTOMER_CANCEL_WINDOW_MS = 5 * 60 * 1000; // 5 minutos (300.000 ms) - RN-007

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

/**
 * Enriquecimento do objeto de pedido com metadados dinâmicos exigidos por API-003 e API-004:
 * - canCustomerCancel (RN-007)
 * - remainingCancelSeconds (RN-007)
 * - whatsappMessage & whatsappUrl (RN-005 / TR-007)
 */
export function enrichOrderWithMetadata(order) {
  if (!order) return null;

  const createdTime = new Date(order.createdAt).getTime();
  const elapsedMs = Math.max(0, Date.now() - (Number.isFinite(createdTime) ? createdTime : Date.now()));
  const canCustomerCancel =
    order.status === ORDER_STATUS.RECEIVED &&
    elapsedMs <= CUSTOMER_CANCEL_WINDOW_MS;
  const remainingCancelSeconds =
    order.status === ORDER_STATUS.RECEIVED
      ? Math.max(0, Math.floor((CUSTOMER_CANCEL_WINDOW_MS - elapsedMs) / 1000))
      : 0;

  const whatsappMessage = formatWhatsAppMessage(order);
  const whatsappUrl = buildWhatsAppUrl(order);

  return {
    ...order,
    canCustomerCancel,
    remainingCancelSeconds,
    whatsappMessage,
    whatsappUrl,
  };
}

export const orderService = {
  /**
   * API-009 / TR-008 / RN-004 / RN-009: Lista pedidos para o Painel do Atendente
   */
  listAdminOrders({ status = null } = {}) {
    const orders = orderRepo.findAll({ status }).map(enrichOrderWithMetadata);
    return {
      orders,
      serverTime: new Date().toISOString(),
    };
  },

  /**
   * API-010 / TR-009 / RN-006: Avança linearmente o status do pedido sem permitir pulos ou retrocessos
   */
  advanceOrderByAdmin(orderId, targetStatus = null) {
    const order = orderRepo.findById(orderId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
    }

    const expectedNext = NEXT_STATUS_MAP[order.status] ?? null;

    if (!expectedNext) {
      throw new AppError(
        `Transição de status inválida: o pedido #${order.id} já se encontra no estado final "${order.status}" (RN-006).`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const desiredStatus = targetStatus || expectedNext;
    if (desiredStatus !== expectedNext) {
      throw new AppError(
        `Transição de status inválida (${order.status} -> ${desiredStatus}): não é permitido pular ou retroceder etapas. Próximo estado obrigatório: ${expectedNext} (RN-006).`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = orderRepo.updateStatus(
      order.id,
      expectedNext,
      new Date().toISOString()
    );
    return { order: enrichOrderWithMetadata(updated) };
  },

  /**
   * API-011 / TR-010 / RN-008: Cancelamento irrestrito pelo atendente para qualquer pedido ativo,
   * sem exigir justificativa. Bloqueia se já estiver DELIVERED ou CANCELLED.
   */
  cancelOrderByAdmin(orderId) {
    const order = orderRepo.findById(orderId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
    }

    const activeStatuses = [
      ORDER_STATUS.RECEIVED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
    ];

    if (!activeStatuses.includes(order.status)) {
      throw new AppError(
        `Não é possível cancelar o pedido #${order.id} pois já está no estado final "${order.status}" (RN-008).`,
        422,
        'ORDER_ALREADY_FINALIZED'
      );
    }

    const updated = orderRepo.updateStatus(
      order.id,
      ORDER_STATUS.CANCELLED,
      new Date().toISOString()
    );
    return { order: enrichOrderWithMetadata(updated) };
  },

  /**
   * API-005 / TR-010 / RN-007: Cancelamento pelo cliente permitido apenas em até 5 minutos
   * e enquanto o pedido estiver em RECEIVED.
   */
  cancelOrderByCustomer(orderId) {
    const order = orderRepo.findById(orderId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== ORDER_STATUS.RECEIVED) {
      throw new AppError(
        'O pedido já entrou em preparo ou foi finalizado e não pode ser cancelado pelo cliente (RN-007).',
        422,
        'CANNOT_CANCEL_IN_PROGRESS'
      );
    }

    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    if (elapsedMs > CUSTOMER_CANCEL_WINDOW_MS) {
      throw new AppError(
        'Prazo de 5 minutos para cancelamento pelo cliente expirado (RN-007).',
        422,
        'CANCEL_WINDOW_EXPIRED'
      );
    }

    const updated = orderRepo.updateStatus(
      order.id,
      ORDER_STATUS.CANCELLED,
      new Date().toISOString()
    );
    return { order: enrichOrderWithMetadata(updated) };
  },

  /**
   * Simulador de chegada de novo pedido no banco SQLite para validação do protótipo (RN-004)
   */
  simulateIncomingOrder(forceDelivery = null) {
    const existing = orderRepo.findAll();
    const maxId = existing.reduce((acc, item) => Math.max(acc, item.id), 100);
    const nextId = maxId + 1;
    const isDineIn =
      forceDelivery === true ? false : forceDelivery === false ? true : nextId % 2 === 0;
    const now = new Date().toISOString();

    if (isDineIn) {
      const tableNum = String(((nextId * 3) % 15) + 1).padStart(2, '0');
      const created = orderRepo.createWithItems(
        {
          id: nextId,
          orderType: 'DINE_IN',
          status: ORDER_STATUS.RECEIVED,
          tableNumber: tableNum,
          customerName: null,
          deliveryAddress: null,
          totalAmount: 47.9,
          createdAt: now,
          updatedAt: now,
        },
        [
          {
            productNameSnapshot: 'Double Cheddar Melt',
            quantity: 1,
            variationNameSnapshot: 'Duplo 160g',
            addonsSnapshot: [{ name: 'Farofa de Bacon', price: 6.0 }],
            notes: 'Sem picles, pão bem selado',
            unitPrice: 39.9,
            subtotal: 39.9,
          },
          {
            productNameSnapshot: 'Água com Gás',
            quantity: 1,
            variationNameSnapshot: '500ml',
            addonsSnapshot: [],
            notes: 'Com rodela de limão',
            unitPrice: 8.0,
            subtotal: 8.0,
          },
        ]
      );
      return { order: enrichOrderWithMetadata(created) };
    }

    const created = orderRepo.createWithItems(
      {
        id: nextId,
        orderType: 'DELIVERY',
        status: ORDER_STATUS.RECEIVED,
        tableNumber: null,
        customerName: `Cliente #${nextId} (Fernanda Lima)`,
        deliveryAddress: 'Rua Sete de Setembro, 88 - Casa 2',
        totalAmount: 64.5,
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          productNameSnapshot: 'Combo Casal Smash',
          quantity: 1,
          variationNameSnapshot: '2 Burgers + 2 Fritas',
          addonsSnapshot: [{ name: 'Maionese Defumada Extra', price: 4.5 }],
          notes: 'Enviar guardanapos e sachês extras',
          unitPrice: 64.5,
          subtotal: 64.5,
        },
      ]
    );
    return { order: enrichOrderWithMetadata(created) };
  },

  /**
   * API-003 / TR-003 a TR-005 / TR-007 / RN-001 a RN-005 / RN-011:
   * Criação pública de pedido pelo cliente (Consumo no local ou Entrega)
   */
  createCustomerOrder(payload = {}) {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError(
        'A sacola não pode estar vazia. Adicione pelo menos 1 item ao pedido (RN-011).',
        422,
        'EMPTY_ORDER_ITEMS'
      );
    }

    const rawOrderType = payload.orderType
      ? String(payload.orderType).toUpperCase().trim()
      : payload.tableNumber
      ? 'DINE_IN'
      : 'DELIVERY';

    if (rawOrderType !== 'DINE_IN' && rawOrderType !== 'DELIVERY') {
      throw new AppError(
        'Modalidade de pedido inválida. Escolha entre Consumo no local (DINE_IN) ou Entrega (DELIVERY) (RN-003).',
        422,
        'INVALID_ORDER_TYPE'
      );
    }

    const orderType = rawOrderType;
    const tableNumber =
      payload.tableNumber !== undefined && payload.tableNumber !== null
        ? String(payload.tableNumber).trim()
        : '';
    const customerName =
      payload.customerName !== undefined && payload.customerName !== null
        ? String(payload.customerName).trim()
        : '';

    // RN-003 / TR-005: Identificação obrigatória condicional por modalidade
    if (orderType === 'DINE_IN' && !tableNumber) {
      throw new AppError(
        'O número da mesa é obrigatório para pedidos de Consumo no local (RN-003).',
        422,
        'TABLE_NUMBER_REQUIRED'
      );
    }

    if (orderType === 'DELIVERY' && !customerName) {
      throw new AppError(
        'O nome do cliente é obrigatório para pedidos na modalidade Entrega (RN-003).',
        422,
        'CUSTOMER_NAME_REQUIRED'
      );
    }

    const itemsList = payload.items.map((item) => {
      const quantity = Number(item.quantity ?? 1);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new AppError(
          'A quantidade de cada item deve ser um número inteiro maior que zero (RF-003).',
          422,
          'INVALID_ITEM_QUANTITY'
        );
      }

      // RN-002 / TR-004: Limite estrito de 140 caracteres na observação
      const rawNotes = String(item.notes ?? item.observation ?? '');
      if (rawNotes.length > 140) {
        throw new AppError(
          'A observação do item não pode ultrapassar o limite máximo de 140 caracteres (RN-002).',
          422,
          'NOTES_LIMIT_EXCEEDED'
        );
      }

      // RN-001 / RN-011 / TR-003: Validação de produto ativo e cálculo de variações e adicionais
      const explicitProductId =
        item.productId !== undefined && item.productId !== null
          ? Number(item.productId)
          : null;
      const dbProduct = explicitProductId
        ? productRepo.findById(explicitProductId)
        : null;

      if (explicitProductId && !dbProduct) {
        throw new AppError(
          `O produto #${explicitProductId} não foi encontrado no cardápio (RN-001).`,
          422,
          'PRODUCT_NOT_FOUND'
        );
      }

      if (dbProduct) {
        const dbCategory = categoryRepo.findById(dbProduct.categoryId);
        if (!dbProduct.active || (dbCategory && !dbCategory.active)) {
          throw new AppError(
            `O produto "${dbProduct.name}" encontra-se inativo e não está disponível para pedido (RN-001).`,
            422,
            'PRODUCT_INACTIVE'
          );
        }
      }

      // Resolução de Variação
      let variationNameSnapshot =
        item.variationNameSnapshot || item.variation || null;
      let resolvedVariationPrice = null;

      if (dbProduct && item.variationId !== undefined && item.variationId !== null) {
        const foundVar = (dbProduct.variations || []).find(
          (v) => v.id === Number(item.variationId) && v.active
        );
        if (!foundVar) {
          throw new AppError(
            `Variação inválida ou inativa para o produto "${dbProduct.name}" (RN-011).`,
            422,
            'INVALID_VARIATION'
          );
        }
        variationNameSnapshot = foundVar.name;
        resolvedVariationPrice = Number(foundVar.price);
      } else if (
        dbProduct &&
        variationNameSnapshot &&
        resolvedVariationPrice === null
      ) {
        const foundVarByName = (dbProduct.variations || []).find(
          (v) =>
            v.name.toLowerCase() === String(variationNameSnapshot).toLowerCase() &&
            v.active
        );
        if (foundVarByName) {
          resolvedVariationPrice = Number(foundVarByName.price);
        }
      }

      // Resolução de Adicionais
      let addonsSnapshot = [];
      if (dbProduct && Array.isArray(item.addonIds) && item.addonIds.length > 0) {
        addonsSnapshot = item.addonIds.map((addonId) => {
          const foundAddon = (dbProduct.addons || []).find(
            (a) => a.id === Number(addonId) && a.active
          );
          if (!foundAddon) {
            throw new AppError(
              `Adicional inválido ou inativo para o produto "${dbProduct.name}" (RN-011).`,
              422,
              'INVALID_ADDON'
            );
          }
          return { name: foundAddon.name, price: Number(foundAddon.price) };
        });
      } else if (Array.isArray(item.addonsSnapshot)) {
        addonsSnapshot = item.addonsSnapshot.map((a) =>
          typeof a === 'string'
            ? { name: a, price: 0 }
            : { name: a.name, price: Number(a.price || 0) }
        );
      } else if (Array.isArray(item.addons)) {
        addonsSnapshot = item.addons.map((a) =>
          typeof a === 'string'
            ? { name: a, price: 0 }
            : { name: a.name, price: Number(a.price || 0) }
        );
      } else if (typeof item.addonsJsonSnapshot === 'string') {
        try {
          const parsed = JSON.parse(item.addonsJsonSnapshot);
          if (Array.isArray(parsed)) {
            addonsSnapshot = parsed.map((a) =>
              typeof a === 'string'
                ? { name: a, price: 0 }
                : { name: a.name, price: Number(a.price || 0) }
            );
          }
        } catch {
          addonsSnapshot = [];
        }
      }

      // Cálculo do preço unitário: (Preço da Variação ?? Preço Base) + Soma(Adicionais) (RN-011)
      let unitPrice = 0;
      if (
        dbProduct &&
        (item.variationId !== undefined ||
          Array.isArray(item.addonIds) ||
          (item.unitPrice === undefined && item.price === undefined))
      ) {
        const base =
          resolvedVariationPrice !== null
            ? resolvedVariationPrice
            : Number(dbProduct.basePrice);
        const addonsSum = addonsSnapshot.reduce(
          (sum, a) => sum + Number(a.price || 0),
          0
        );
        unitPrice = roundMoney(base + addonsSum);
      } else {
        unitPrice = roundMoney(
          item.unitPrice ?? item.price ?? (dbProduct ? dbProduct.basePrice : 0)
        );
      }

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new AppError(
          'O preço unitário de cada item deve ser maior que zero (RN-011).',
          422,
          'INVALID_ITEM_PRICE'
        );
      }

      const subtotal = roundMoney(unitPrice * quantity);

      return {
        productId: dbProduct ? dbProduct.id : null,
        productNameSnapshot:
          dbProduct?.name ||
          item.productNameSnapshot ||
          item.title ||
          item.name ||
          'Item Artesanal',
        quantity,
        variationNameSnapshot,
        addonsSnapshot,
        notes: rawNotes.trim(),
        unitPrice,
        subtotal,
      };
    });

    const calculatedTotal = roundMoney(
      itemsList.reduce((sum, it) => sum + it.subtotal, 0)
    );
    const totalAmount =
      calculatedTotal > 0
        ? calculatedTotal
        : roundMoney(payload.totalAmount || payload.totalPrice || 0);

    if (totalAmount <= 0) {
      throw new AppError(
        'O valor total do pedido deve ser maior que zero (RN-011).',
        422,
        'INVALID_TOTAL_AMOUNT'
      );
    }

    const now = new Date().toISOString();
    const orderData = {
      orderType,
      status: ORDER_STATUS.RECEIVED,
      tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
      customerName: orderType === 'DELIVERY' ? customerName : null,
      customerPhone: payload.customerPhone || null,
      deliveryAddress:
        orderType === 'DELIVERY' && payload.deliveryAddress
          ? String(payload.deliveryAddress).trim()
          : null,
      paymentMethod: payload.paymentMethod || 'PIX',
      isPaid: Boolean(payload.isPaid),
      deliveryPin: payload.deliveryPin || '8492',
      totalAmount,
      createdAt: now,
      updatedAt: now,
    };

    const created = orderRepo.createWithItems(orderData, itemsList);
    return { order: enrichOrderWithMetadata(created) };
  },

  /**
   * API-004 / TR-011 / RN-006 / RN-007: Busca dados de um pedido pelo ID para rastreamento
   */
  getOrderById(orderId) {
    const order = orderRepo.findById(orderId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
    }
    return { order: enrichOrderWithMetadata(order) };
  },

  /**
   * Confirmação / Atualização de pagamento do cliente
   */
  markOrderAsPaid(orderId, paymentMethod = 'PIX') {
    const order = orderRepo.findById(orderId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
    }
    const updated = orderRepo.markAsPaid(order.id, paymentMethod);
    return { order: enrichOrderWithMetadata(updated) };
  },

  /**
   * Lista pedidos de entrega para o aplicativo do motorista
   */
  listDriverOrders() {
    const all = orderRepo.findAll();
    const deliveryOrders = all
      .filter((o) => o.orderType === 'DELIVERY')
      .map(enrichOrderWithMetadata);
    return { orders: deliveryOrders, serverTime: new Date().toISOString() };
  },

  /**
   * Confirmação de PIN pelo motorista para entrega realizada
   */
  confirmDriverPin(orderId, pin) {
    const order = orderRepo.findById(orderId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND');
    }
    const expectedPin = order.deliveryPin || '8492';
    if (String(pin).trim() !== String(expectedPin).trim()) {
      throw new AppError('PIN de confirmação incorreto.', 400, 'INVALID_DELIVERY_PIN');
    }
    const updated = orderRepo.updateStatus(
      order.id,
      ORDER_STATUS.DELIVERED,
      new Date().toISOString()
    );
    return { order: enrichOrderWithMetadata(updated), success: true };
  },

  /**
   * Obtém métricas operacionais consolidadas para o Dashboard do Atendente/Gestor
   */
  getMetrics({ period = 'today' } = {}) {
    const metrics = orderRepo.getMetrics({ period });
    return {
      success: true,
      metrics,
      serverTime: new Date().toISOString(),
    };
  },
};
