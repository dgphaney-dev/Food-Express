/**
 * Utilitário de Impressão Térmica de Comanda / Cupom de Cozinha e Delivery (80mm / 58mm)
 */

import { formatPrice } from '../../src/utils/helpers';

export function printThermalReceipt(order) {
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=380,height=600');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir a comanda térmica.');
    return;
  }

  const isDineIn = order.orderType === 'DINE_IN';
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  const itemsHtml = (order.items || [])
    .map((item) => {
      const addons = Array.isArray(item.addonsSnapshot)
        ? item.addonsSnapshot.join(', ')
        : '';
      return `
        <div class="item-row">
          <div class="item-header">
            <span class="qty">${item.quantity}x</span>
            <span class="name">${item.productNameSnapshot || 'Item'}</span>
            <span class="price">${formatPrice(item.subtotal)}</span>
          </div>
          ${item.variationNameSnapshot ? `<div class="detail">• Ponto/Var: ${item.variationNameSnapshot}</div>` : ''}
          ${addons ? `<div class="detail">• Adicionais: ${addons}</div>` : ''}
          ${item.notes ? `<div class="notes">OBS: ${item.notes}</div>` : ''}
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Comanda #${order.id} - FoodExpress</title>
      <style>
        @page {
          margin: 0;
          size: 80mm auto;
        }
        body {
          margin: 0;
          padding: 10px 12px;
          font-family: 'Courier New', Courier, monospace;
          color: #000;
          background: #fff;
          font-size: 13px;
          line-height: 1.3;
          width: 76mm;
          max-width: 76mm;
          box-sizing: border-box;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .double-divider {
          border-top: 2px dashed #000;
          margin: 8px 0;
        }
        .header-title {
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 2px;
        }
        .badge-type {
          display: inline-block;
          font-size: 15px;
          font-weight: 900;
          padding: 3px 6px;
          border: 2px solid #000;
          margin: 4px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin: 2px 0;
        }
        .item-row {
          margin: 6px 0;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }
        .item-header .qty { width: 24px; }
        .item-header .name { flex: 1; padding: 0 4px; }
        .item-header .price { text-align: right; }
        .detail {
          font-size: 11px;
          padding-left: 24px;
        }
        .notes {
          font-size: 11px;
          font-weight: bold;
          padding-left: 24px;
          background: #f0f0f0;
          margin-top: 2px;
        }
        .total-box {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 900;
          margin: 6px 0;
        }
        .footer {
          font-size: 10px;
          text-align: center;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="header-title uppercase">FOODEXPRESS</div>
        <div>STEAKHOUSE & ARTISAN BURGERS</div>
        <div class="divider"></div>
        <div class="badge-type uppercase">
          ${isDineIn ? `MESA ${order.tableNumber}` : 'DELIVERY / VIAGEM'}
        </div>
        <div style="font-size: 18px; font-weight: bold; margin: 2px 0;">PEDIDO #${order.id}</div>
        <div class="info-row">
          <span>DATA/HORA:</span>
          <span>${orderDate}</span>
        </div>
      </div>

      <div class="divider"></div>

      ${
        isDineIn
          ? `<div class="info-row"><span>MODALIDADE:</span><span class="bold">CONSUMO NO LOCAL</span></div>`
          : `
            <div class="info-row"><span>CLIENTE:</span><span class="bold">${order.customerName || 'Não informado'}</span></div>
            ${order.customerPhone ? `<div class="info-row"><span>WHATSAPP:</span><span>${order.customerPhone}</span></div>` : ''}
            ${order.deliveryAddress ? `<div style="font-size: 11px; margin-top: 2px;"><strong>END:</strong> ${order.deliveryAddress}</div>` : ''}
            ${order.deliveryPin ? `<div class="info-row" style="margin-top: 4px;"><span>PIN ENTREGA:</span><span class="bold" style="font-size: 14px;">#${order.deliveryPin}</span></div>` : ''}
          `
      }

      <div class="double-divider"></div>
      <div class="bold uppercase text-center" style="font-size: 11px; margin-bottom: 4px;">ITENS DA COMANDA</div>
      <div class="divider"></div>

      ${itemsHtml}

      <div class="double-divider"></div>

      <div class="info-row">
        <span>STATUS:</span>
        <span class="bold uppercase">${order.status}</span>
      </div>
      <div class="info-row">
        <span>PAGAMENTO:</span>
        <span class="bold uppercase">${order.paymentMethod || 'A COMBINAR'} ${order.isPaid ? '(PAGO)' : '(PENDENTE)'}</span>
      </div>

      <div class="divider"></div>

      <div class="total-box">
        <span>TOTAL:</span>
        <span>${formatPrice(order.totalAmount)}</span>
      </div>

      <div class="divider"></div>
      <div class="footer">
        *** COMANDA DE COZINHA & EXPEDIÇÃO ***<br>
        SISTEMA FOODEXPRESS KDS
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => { window.close(); }, 800);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
