import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../site/backend/app.js';
import { initDatabase } from '../../site/backend/db/connection.js';
import { seedDatabase } from '../../site/backend/db/seed.js';
import { orderRepo } from '../../site/backend/admin/repositories/orderRepo.js';
import { productRepo } from '../../site/backend/admin/repositories/productRepo.js';

const minutesAgo = (mins) =>
  new Date(Date.now() - mins * 60 * 1000).toISOString();

describe('Integration — Backend Completo (Auth, Cardápio, Pedidos, Regras RN-001 a RN-012)', () => {
  let adminToken = '';

  beforeEach(async () => {
    initDatabase(':memory:');
    seedDatabase();

    // Garante que o seed de produção NÃO injeta pedidos de teste nem usuários fictícios
    expect(orderRepo.findAll()).toHaveLength(0);

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

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.username).toBe('admin');
  });

  it('API-006, API-007, API-008 / RN-001 / RN-011: deve gerenciar categorias e produtos, validando preço > 0 e ocultando inativos no cardápio público', async () => {
    // Cria um produto inativo de teste isolado para validar ocultação no cardápio público (RN-001)
    productRepo.create({
      categoryId: 1,
      name: 'Produto Inativo Teste',
      description: 'Fixture isolado de teste',
      basePrice: 39.9,
      active: false,
      variations: [],
      addons: [],
    });

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
    expect(allPublicProducts.length).toBeGreaterThanOrEqual(10);
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

  it('API-003 / RN-001, RN-002, RN-003, RN-011: deve validar mesa vs. nome, trava de 140 caracteres em observações, bloquear produto inativo e calcular preço com variações e adicionais', async () => {
    // 1. DINE_IN sem número da mesa -> deve falhar com 422 (RN-003)
    const missingTableRes = await request(app)
      .post('/api/public/orders')
      .send({
        orderType: 'DINE_IN',
        tableNumber: '',
        items: [{ productId: 1, quantity: 1 }],
      });
    expect(missingTableRes.status).toBe(422);

    // 2. DELIVERY sem nome do cliente -> deve falhar com 422 (RN-003)
    const missingNameRes = await request(app)
      .post('/api/public/orders')
      .send({
        orderType: 'DELIVERY',
        customerName: '   ',
        items: [{ productId: 1, quantity: 1 }],
      });
    expect(missingNameRes.status).toBe(422);

    // 3. Observação > 140 caracteres -> deve falhar com 422 (RN-002 / TR-004)
    const longNotesRes = await request(app)
      .post('/api/public/orders')
      .send({
        orderType: 'DINE_IN',
        tableNumber: '10',
        items: [
          {
            productId: 1,
            quantity: 1,
            notes: 'A'.repeat(141),
          },
        ],
      });
    expect(longNotesRes.status).toBe(422);

    // 4. Produto inativo -> deve falhar com 422 (RN-001)
    const inactiveProd = productRepo.create({
      categoryId: 1,
      name: 'Produto Inativo Fixture',
      description: 'Fixture de teste',
      basePrice: 44.0,
      active: false,
      variations: [],
      addons: [],
    });

    const adminMenuRes = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(inactiveProd).toBeDefined();

    const inactiveOrderRes = await request(app)
      .post('/api/public/orders')
      .send({
        orderType: 'DINE_IN',
        tableNumber: '10',
        items: [{ productId: inactiveProd.id, quantity: 1 }],
      });
    expect(inactiveOrderRes.status).toBe(422);

    // 5. Cálculo oficial com variação + adicionais no backend (RN-011 / TR-003)
    const activeBurger = adminMenuRes.body.products.find(
      (p) => p.name === 'X-Burger Artesanal'
    );
    const duploVar = activeBurger.variations.find((v) => v.name === 'Duplo'); // 36.90
    const baconAddon = activeBurger.addons.find((a) => a.name === 'Bacon Extra'); // 5.00
    const cheddarAddon = activeBurger.addons.find(
      (a) => a.name === 'Cheddar Extra'
    ); // 4.00

    const calcOrderRes = await request(app)
      .post('/api/public/orders')
      .send({
        orderType: 'DELIVERY',
        customerName: 'Carlos Cliente',
        deliveryAddress: 'Av. Paulista, 900',
        items: [
          {
            productId: activeBurger.id,
            variationId: duploVar.id,
            addonIds: [baconAddon.id, cheddarAddon.id],
            quantity: 2,
            notes: 'Sem cebola, ponto ao ponto',
          },
        ],
      });

    expect(calcOrderRes.status).toBe(201);
    // (36.90 + 5.00 + 4.00) * 2 = 45.90 * 2 = 91.80
    expect(calcOrderRes.body.order.totalAmount).toBeCloseTo(91.8, 2);
    expect(calcOrderRes.body.order.whatsappUrl).toContain('https://wa.me/');
    expect(calcOrderRes.body.order.whatsappMessage).toContain('Carlos Cliente');
    expect(calcOrderRes.body.order.canCustomerCancel).toBe(true);
    expect(calcOrderRes.body.order.remainingCancelSeconds).toBeGreaterThan(290);
  });

  it('API-009, API-010 / RN-006: deve avançar status de pedido estritamente na sequência linear e recusar pulos de etapa', async () => {
    const order = orderRepo.createWithItems(
      {
        orderType: 'DINE_IN',
        status: 'RECEIVED',
        tableNumber: '12',
        totalAmount: 28.9,
        createdAt: minutesAgo(1),
        updatedAt: minutesAgo(1),
      },
      [
        {
          productNameSnapshot: 'X-Burger Artesanal',
          quantity: 1,
          unitPrice: 28.9,
          subtotal: 28.9,
        },
      ]
    );

    const skipRes = await request(app)
      .patch(`/api/admin/orders/${order.id}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetStatus: 'READY' });
    expect(skipRes.status).toBe(422);

    // Avanço válido: RECEIVED -> PREPARING
    const step1 = await request(app)
      .patch(`/api/admin/orders/${order.id}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step1.status).toBe(200);
    expect(step1.body.order.status).toBe('PREPARING');

    // Avanço válido: PREPARING -> READY
    const step2 = await request(app)
      .patch(`/api/admin/orders/${order.id}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step2.status).toBe(200);
    expect(step2.body.order.status).toBe('READY');

    // Avanço válido: READY -> DELIVERED
    const step3 = await request(app)
      .patch(`/api/admin/orders/${order.id}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step3.status).toBe(200);
    expect(step3.body.order.status).toBe('DELIVERED');

    // Tentar avançar após DELIVERED deve retornar 422
    const step4 = await request(app)
      .patch(`/api/admin/orders/${order.id}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(step4.status).toBe(422);
  });

  it('API-005, API-011 / RN-007, RN-008: deve permitir cancelamento pelo cliente em até 5 min (RECEIVED), bloquear após 5 min, e permitir cancelamento pelo atendente a qualquer momento', async () => {
    const sampleItem = [
      {
        productNameSnapshot: 'X-Burger Artesanal',
        quantity: 1,
        unitPrice: 28.9,
        subtotal: 28.9,
      },
    ];

    const recentOrder = orderRepo.createWithItems(
      {
        orderType: 'DINE_IN',
        status: 'RECEIVED',
        tableNumber: '12',
        totalAmount: 28.9,
        createdAt: minutesAgo(2),
        updatedAt: minutesAgo(2),
      },
      sampleItem
    );
    const expiredOrder = orderRepo.createWithItems(
      {
        orderType: 'DELIVERY',
        status: 'RECEIVED',
        customerName: 'Cliente Expirado',
        totalAmount: 28.9,
        createdAt: minutesAgo(6),
        updatedAt: minutesAgo(6),
      },
      sampleItem
    );
    const preparingOrder = orderRepo.createWithItems(
      {
        orderType: 'DINE_IN',
        status: 'PREPARING',
        tableNumber: '04',
        totalAmount: 28.9,
        createdAt: minutesAgo(10),
        updatedAt: minutesAgo(8),
      },
      sampleItem
    );
    const deliveredOrder = orderRepo.createWithItems(
      {
        orderType: 'DINE_IN',
        status: 'DELIVERED',
        tableNumber: '08',
        totalAmount: 28.9,
        createdAt: minutesAgo(30),
        updatedAt: minutesAgo(15),
      },
      sampleItem
    );

    // Pedido recente (2 min) em RECEIVED -> cliente pode cancelar
    const custCancelOk = await request(app).post(`/api/public/orders/${recentOrder.id}/cancel`);
    expect(custCancelOk.status).toBe(200);
    expect(custCancelOk.body.order.status).toBe('CANCELLED');

    // Pedido criado há 6 minutos (> 5 min) -> cliente NÃO pode cancelar (RN-007)
    const custCancelExpired = await request(app).post(
      `/api/public/orders/${expiredOrder.id}/cancel`
    );
    expect(custCancelExpired.status).toBe(422);

    // Atendente PODE cancelar pedido em PREPARING sem justificativa (RN-008)
    const adminCancelRes = await request(app)
      .post(`/api/admin/orders/${preparingOrder.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminCancelRes.status).toBe(200);
    expect(adminCancelRes.body.order.status).toBe('CANCELLED');

    // Pedido já em DELIVERED -> não pode ser cancelado
    const cancelDeliveredRes = await request(app)
      .post(`/api/admin/orders/${deliveredOrder.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelDeliveredRes.status).toBe(422);
  });

  it('API-003, API-004, API-012: deve criar pedido do cliente, simular pagamento e permitir ao motorista confirmar entrega via PIN', async () => {
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

    // Cliente realiza pagamento via PIX
    const payRes = await request(app)
      .post(`/api/public/orders/${newOrderId}/pay`)
      .send({ paymentMethod: 'PIX' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.order.isPaid).toBe(true);

    // Motorista lista pedidos de entrega
    const driverOrdersRes = await request(app).get('/api/driver/orders');
    expect(driverOrdersRes.status).toBe(200);
    const hasCreatedOrder = driverOrdersRes.body.orders.some(
      (o) => o.id === newOrderId
    );
    expect(hasCreatedOrder).toBe(true);

    // Motorista confirma entrega digitando PIN
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
    expect(authMetrics.body.metrics.totalOrders).toBe(0);
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

  it('API Banners: deve permitir ao gestor listar, criar, editar, alternar status e excluir banners do carrossel do Hero', async () => {
    // 1. Listagem pública de banners ativos
    const publicRes = await request(app).get('/api/public/banners');
    expect(publicRes.status).toBe(200);
    expect(Array.isArray(publicRes.body.banners)).toBe(true);
    expect(publicRes.body.banners.length).toBeGreaterThanOrEqual(3);

    // 2. Listagem administrativa com autenticação
    const adminRes = await request(app)
      .get('/api/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(Array.isArray(adminRes.body.banners)).toBe(true);

    // 3. Criar novo banner
    const createRes = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Tomahawk Steak Especial',
        subtitle: 'Corte nobre de 900g com osso longo grelhado na brasa.',
        badge: 'EDIÇÃO LIMITADA',
        tag: 'CORTE NOBRE PREMIUM',
        schedule: 'SEXTAS E SÁBADOS',
        ctaText: 'RESERVAR AGORA',
        ctaSubtext: 'EDIÇÃO LIMITADA',
        photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
        active: true,
        sortOrder: 4,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.banner.title).toBe('Tomahawk Steak Especial');
    const newBannerId = createRes.body.banner.id;

    // 4. Validação: título obrigatório
    const badRes = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        photoUrl: 'https://images.unsplash.com/photo-test',
      });
    expect(badRes.status).toBe(422);

    // 5. Atualizar banner
    const updateRes = await request(app)
      .put(`/api/admin/banners/${newBannerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Tomahawk Steak Prime',
        ctaText: 'PEDIR AGORA',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.banner.title).toBe('Tomahawk Steak Prime');

    // 6. Alternar status ativo/inativo
    const toggleRes = await request(app)
      .patch(`/api/admin/banners/${newBannerId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.banner.active).toBe(false);

    // 7. Excluir banner de teste
    const delRes = await request(app)
      .delete(`/api/admin/banners/${newBannerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
