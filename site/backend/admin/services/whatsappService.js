import { env } from '../../config/env.js';

function formatCurrencyBRL(value) {
  const num = Number(value || 0);
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

/**
 * RN-005 / TR-007: Geração determinística de texto padronizado para pedidos no WhatsApp
 */
export function formatWhatsAppMessage(order) {
  if (!order) return '';

  const isDelivery = order.orderType === 'DELIVERY';
  const lines = [
    `*🍔 NOVO PEDIDO #${order.id} — FoodExpress*`,
    `*Modalidade:* ${isDelivery ? 'Entrega' : 'Consumo no local'}`,
  ];

  if (isDelivery) {
    lines.push(`*Cliente:* ${order.customerName || 'Cliente'}`);
    if (order.deliveryAddress) {
      lines.push(`*Endereço/Ref:* ${order.deliveryAddress}`);
    }
  } else if (order.tableNumber) {
    lines.push(`*Mesa:* ${order.tableNumber}`);
  }

  lines.push('');
  lines.push('*Itens do Pedido:*');

  const items = Array.isArray(order.items) ? order.items : [];
  for (const item of items) {
    let itemHeader = `• ${item.quantity}x ${item.productNameSnapshot}`;
    if (item.variationNameSnapshot) {
      itemHeader += ` (Variação: ${item.variationNameSnapshot})`;
    }
    lines.push(itemHeader);

    let addons = [];
    if (Array.isArray(item.addonsSnapshot)) {
      addons = item.addonsSnapshot;
    } else if (typeof item.addonsJsonSnapshot === 'string') {
      try {
        addons = JSON.parse(item.addonsJsonSnapshot);
      } catch {
        addons = [];
      }
    }

    if (addons.length > 0) {
      const addonNames = addons
        .map((a) => (typeof a === 'string' ? a : a?.name))
        .filter(Boolean)
        .join(', ');
      if (addonNames) {
        lines.push(`  + Adicionais: ${addonNames}`);
      }
    }

    if (item.notes && String(item.notes).trim().length > 0) {
      lines.push(`  _Obs: ${String(item.notes).trim()}_`);
    }

    const subtotal =
      item.subtotal !== undefined
        ? Number(item.subtotal)
        : Number(item.unitPrice || 0) * Number(item.quantity || 1);
    lines.push(`  Subtotal: ${formatCurrencyBRL(subtotal)}`);
  }

  lines.push('');
  lines.push(`*Valor Total: ${formatCurrencyBRL(order.totalAmount)}*`);

  return lines.join('\n');
}

/**
 * RN-005 / TR-007: Gera URL wa.me oficial com mensagem codificada
 */
export function buildWhatsAppUrl(order, customPhone = null) {
  const phone = String(customPhone || env.RESTAURANT_WHATSAPP || '5511999999999').replace(
    /\D/g,
    ''
  );
  const message = formatWhatsAppMessage(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
