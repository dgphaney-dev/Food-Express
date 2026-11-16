import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../site/backend/app.js';
import { initDatabase } from '../../site/backend/db/connection.js';
import { seedDatabase } from '../../site/backend/db/seed.js';

describe('Integration — Backend Admin API (Auth, Cardápio e Fila de Pedidos)', () => {
  let adminToken = '';

  beforeEach(async () => {
    initDatabase(':memory:');
    seedDatabase({ forceResetOrders: true });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.token;
  });

  it('API-001 / RN-010: deve bloquear acesso a /api/admin/* sem token e recusar login inválido', async () => {
    const unauthOrders = await request(app).get('/api/admin/orders');
    expect(unauthOrders.status).toBe(401);

    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(badLogin.status).toBe(401);
  });

  it('API-006, API-007, API-008 / RN-001 / RN-011: deve gerenciar categorias e produtos, validando preço > 0 e ocultando inativos no cardápio público', async () => {
    // Admin vê todos os produtos (inclusive o inativo do seed)
    const adminMenuRes = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminMenuRes.status).toBe(200);
    const hasInactiveInAdmin = adminMenuRes.body.products.some(
      (p) => p.active === false
    );
    expect(hasInactiveInAdmin).toBe(true);

    // Público vê apenas ativos (RN-001)
    const publicMenuRes = await request(app).get('/api/public/menu');
    expect(publicMenuRes.status).toBe(200);
    const allPublicProducts = publicMenuRes.body.categories.flatMap(
      (c) => c.products
    );
    expect(allPublicProducts.every((p) => p.active === true)).toBe(true);

    // Tentativa de cadastrar produto com preço <= 0 deve retornar 422 (RN-001)
    const invalidProdRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: 1,
        name: 'Produto Inválido',
        basePrice: 0,
      });
    expect(invalidProdRes.status).toBe(422);

    // Cadastro válido com variações e adicionais (RF-001 / RF-013)
    const validProdRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: 1,
        name: 'Burger Especial da Casa',
        description: 'Pão australiano e costela',
        basePrice: 32.5,
        active: true,
        variations: [{ name: '200g', price: 32.5 }],
        addons: [{ name: 'Cebola Crispy', price: 4.0 }],
      });
    expect(validProdRes.status).toBe(201);
    expect(validProdRes.body.product.variations).toHaveLength(1);
    expect(validProdRes.body.product.addons).toHaveLength(1);
  });

  it('API-009, API-010 / RN-006: deve avançar status de pedido estritamente na sequência linear e recusar pulos de etapa', async () => {
    // Pedido #101 nasce em RECEIVED no seed
    const skipRes = await request(app)
      .patch('/api/admin/orders/101/advance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetStatus: 'READY' });
    expect(skipRes.status).toBe(422);

    // Avanço válido: RECEIVED -> PREPARING
    const step1 = await request(app)
      .patch('/api/admin/orders/101/advance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step1.status).toBe(200);
    expect(step1.body.order.status).toBe('PREPARING');

    // Avanço válido: PREPARING -> READY
    const step2 = await request(app)
      .patch('/api/admin/orders/101/advance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step2.status).toBe(200);
    expect(step2.body.order.status).toBe('READY');

    // Avanço válido: READY -> DELIVERED
    const step3 = await request(app)
      .patch('/api/admin/orders/101/advance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step3.status).toBe(200);
    expect(step3.body.order.status).toBe('DELIVERED');

    // Tentar avançar após DELIVERED deve retornar 422
    const step4 = await request(app)
      .patch('/api/admin/orders/101/advance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step4.status).toBe(422);
  });

  it('API-011 / RN-008: deve permitir ao atendente cancelar qualquer pedido ativo sem justificativa e bloquear se já entregue', async () => {
    // Pedido #103 está em PREPARING -> pode ser cancelado pelo atendente
    const cancelRes = await request(app)
      .post('/api/admin/orders/103/cancel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order.status).toBe('CANCELLED');

    // Pedido #105 já está em DELIVERED -> não pode ser cancelado
    const cancelDeliveredRes = await request(app)
      .post('/api/admin/orders/105/cancel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelDeliveredRes.status).toBe(422);
  });

  it('API-003, API-004, API-012: deve criar pedido do cliente, simular pagamento e permitir ao motorista confirmar entrega via PIN', async () => {
    // 1. Cliente cria pedido pelo app
    const orderRes = await request(app)
      .post('/api/public/orders')
      .send({
        orderType: 'DELIVERY',
        customerName: 'Gabriel Oliveira',
        customerPhone: '(11) 98765-4321',
        deliveryAddress: 'Rua das Flores, 123',
        totalAmount: 48.9,
        paymentMethod: 'PIX',
        isPaid: false,
        deliveryPin: '8492',
        items: [
          {
            title: 'X-Burger Artesanal',
            quantity: 1,
            price: 32.9,
            variation: 'Ao Ponto',
            addons: ['Bacon Extra'],
          },
        ],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order).toBeDefined();
    const newOrderId = orderRes.body.order.id;
    expect(orderRes.body.order.status).toBe('RECEIVED');
    expect(orderRes.body.order.deliveryPin).toBe('8492');

    // 2. Cliente realiza pagamento via PIX
    const payRes = await request(app)
      .post(`/api/public/orders/${newOrderId}/pay`)
      .send({ paymentMethod: 'PIX' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.order.isPaid).toBe(true);

    // 3. Motorista lista pedidos de entrega
    const driverOrdersRes = await request(app).get('/api/driver/orders');
    expect(driverOrdersRes.status).toBe(200);
    const hasCreatedOrder = driverOrdersRes.body.orders.some(
      (o) => o.id === newOrderId
    );
    expect(hasCreatedOrder).toBe(true);

    // 4. Motorista confirma entrega digitando PIN
    const wrongPinRes = await request(app)
      .post(`/api/driver/orders/${newOrderId}/confirm-pin`)
      .send({ pin: '0000' });
    expect(wrongPinRes.status).toBe(400);

    const rightPinRes = await request(app)
      .post(`/api/driver/orders/${newOrderId}/confirm-pin`)
      .send({ pin: '8492' });
    expect(rightPinRes.status).toBe(200);
    expect(rightPinRes.body.order.status).toBe('DELIVERED');
  });

  it('API-013 / Dashboard: deve retornar métricas consolidadas em /api/admin/metrics com autenticação', async () => {
    const unauthMetrics = await request(app).get('/api/admin/metrics');
    expect(unauthMetrics.status).toBe(401);

    const authMetrics = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(authMetrics.status).toBe(200);
    expect(authMetrics.body.success).toBe(true);
    expect(authMetrics.body.metrics).toBeDefined();
    expect(authMetrics.body.metrics.totalOrders).toBeGreaterThanOrEqual(1);
    expect(typeof authMetrics.body.metrics.totalRevenue).toBe('number');
    expect(typeof authMetrics.body.metrics.averageTicket).toBe('number');
    expect(authMetrics.body.metrics.statusCounts).toBeDefined();
    expect(Array.isArray(authMetrics.body.metrics.topProducts)).toBe(true);
  });

  it('API-014 / Equipe & Acessos: deve gerenciar cadastro de usuários (CRUD) no SQLite com proteção e validação de senhas', async () => {
    // 1. Listar usuários cadastrados (deve vir sem hash de senha)
    const listRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.users)).toBe(true);
    expect(listRes.body.users.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.users[0].passwordHash).toBeUndefined();

    // 2. Criar novo usuário
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ana Carolina Teste',
        username: 'ana.carolina',
        password: 'senhaSegura123',
        role: 'ATENDENTE',
        phone: '(11) 98888-7777',
        active: true,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.user.id).toBeDefined();
    expect(createRes.body.user.username).toBe('ana.carolina');
    expect(createRes.body.user.role).toBe('ATENDENTE');
    const newUserId = createRes.body.user.id;

    // 3. O novo usuário deve conseguir fazer login com a senha recém-criada
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ana.carolina', password: 'senhaSegura123' });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.token).toBeDefined();

    // 4. Tentativa de cadastrar usuário duplicado deve retornar 409
    const dupRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Outra Ana',
        username: 'ana.carolina',
        password: 'senhaSegura123',
      });
    expect(dupRes.status).toBe(409);

    // 5. Atualizar usuário
    const updateRes = await request(app)
      .put(`/api/admin/users/${newUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ana Carolina Silva',
        phone: '(11) 99999-0000',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.name).toBe('Ana Carolina Silva');

    // 6. Toggle de status ativo/inativo
    const toggleRes = await request(app)
      .patch(`/api/admin/users/${newUserId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.user.active).toBe(false);

    // 7. Excluir usuário de teste
    const delRes = await request(app)
      .delete(`/api/admin/users/${newUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
