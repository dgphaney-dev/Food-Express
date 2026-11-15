import { Router } from 'express';
import { menuController } from '../admin/controllers/menuController.js';
import { orderController } from '../admin/controllers/orderController.js';
import { adminRouter, authRouter } from '../admin/routes/adminRoutes.js';

export const apiRouter = Router();

// Healthcheck da API
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'foodexpress-backend',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Rotas de Autenticação (API-001)
// ============================================================================
apiRouter.use('/auth', authRouter);

// ============================================================================
// Rotas Públicas de Cardápio e Pedidos (API-002, API-003, API-004, API-005)
// ============================================================================
apiRouter.get('/public/menu', menuController.getPublicMenu);
apiRouter.post('/public/orders', orderController.createCustomerOrder);
apiRouter.get('/public/orders/:id', orderController.getOrderById);
apiRouter.post('/public/orders/:id/pay', orderController.markOrderAsPaid);
apiRouter.post('/public/orders/:id/cancel', orderController.cancelOrderByCustomer);

// ============================================================================
// Rotas da Operação do Entregador / Motorista
// ============================================================================
apiRouter.get('/driver/orders', orderController.listDriverOrders);
apiRouter.post('/driver/orders/:id/confirm-pin', orderController.confirmDriverPin);

// ============================================================================
// Rotas Administrativas Protegidas por Token JWT (RN-010 / TR-006)
// ============================================================================
apiRouter.use('/admin', adminRouter);
