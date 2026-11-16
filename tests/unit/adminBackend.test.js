import { describe, expect, it } from 'vitest';
import {
  generateAdminToken,
  hashPassword,
  verifyAdminToken,
  verifyPassword,
} from '../../site/backend/admin/services/authService.js';
import {
  NEXT_STATUS_MAP,
  ORDER_STATUS,
} from '../../site/backend/admin/services/orderService.js';
import {
  buildWhatsAppUrl,
  formatWhatsAppMessage,
} from '../../site/backend/admin/services/whatsappService.js';

describe('Unit — Segurança (scrypt + JWT), Máquina de Estados e Resumo WhatsApp', () => {
  it('RNF-002 / TR-006: deve gerar hash scrypt irreversível com salt aleatório e validar senha corretamente', () => {
    const plain = 'admin123';
    const hash1 = hashPassword(plain);
    const hash2 = hashPassword(plain);

    expect(hash1).not.toBe(plain);
    expect(hash1).toContain(':');
    expect(hash1).not.toBe(hash2); // salts distintos
    expect(verifyPassword(plain, hash1)).toBe(true);
    expect(verifyPassword('senha-errada', hash1)).toBe(false);
  });

  it('RN-010 / TR-006: deve assinar e verificar token JWT administrativo (HMAC-SHA256)', () => {
    const token = generateAdminToken({
      id: 1,
      username: 'admin',
      role: 'ADMIN',
    });

    const payload = verifyAdminToken(token);
    expect(payload.sub).toBe(1);
    expect(payload.username).toBe('admin');
    expect(payload.role).toBe('ADMIN');
  });

  it('RN-006 / TR-009: mapa de transição linear deve seguir estritamente RECEIVED -> PREPARING -> READY -> DELIVERED', () => {
    expect(NEXT_STATUS_MAP[ORDER_STATUS.RECEIVED]).toBe(ORDER_STATUS.PREPARING);
    expect(NEXT_STATUS_MAP[ORDER_STATUS.PREPARING]).toBe(ORDER_STATUS.READY);
    expect(NEXT_STATUS_MAP[ORDER_STATUS.READY]).toBe(ORDER_STATUS.DELIVERED);
    expect(NEXT_STATUS_MAP[ORDER_STATUS.DELIVERED]).toBeNull();
    expect(NEXT_STATUS_MAP[ORDER_STATUS.CANCELLED]).toBeNull();
  });

  it('RN-005 / TR-007: deve formatar resumo padronizado de Entrega para WhatsApp com itens, variações, adicionais, observações e total', () => {
    const sampleOrder = {
      id: 101,
      orderType: 'DELIVERY',
      customerName: 'João Silva',
      deliveryAddress: 'Rua das Flores, 123 - Apto 4',
      totalAmount: 72.0,
      items: [
        {
          quantity: 2,
          productNameSnapshot: 'X-Burger Artesanal',
          variationNameSnapshot: 'Duplo',
          addonsSnapshot: [
            { name: 'Bacon Extra', price: 5.0 },
            { name: 'Cheddar', price: 4.0 },
          ],
          notes: 'Sem cebola, maionese à parte',
          unitPrice: 36.0,
          subtotal: 72.0,
        },
      ],
    };

    const msg = formatWhatsAppMessage(sampleOrder);
    expect(msg).toContain('NOVO PEDIDO #101');
    expect(msg).toContain('João Silva');
    expect(msg).toContain('Rua das Flores, 123 - Apto 4');
    expect(msg).toContain('2x X-Burger Artesanal (Variação: Duplo)');
    expect(msg).toContain('Bacon Extra, Cheddar');
    expect(msg).toContain('Sem cebola, maionese à parte');
    expect(msg).toContain('R$ 72,00');

    const url = buildWhatsAppUrl(sampleOrder, '5511999999999');
    expect(url).toContain('https://wa.me/5511999999999?text=');
  });
});
