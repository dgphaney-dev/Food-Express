import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { menuController } from '../controllers/menuController.js';
import { orderController } from '../controllers/orderController.js';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export const authRouter = Router();
authRouter.post('/login', authController.login);

export const adminRouter = Router();
adminRouter.use(authMiddleware);

// Cardápio Admin (API-006, API-007, API-008)
adminRouter.get('/menu', menuController.getAdminMenu);
adminRouter.post('/categories', menuController.createCategory);
adminRouter.put('/categories/:id', menuController.updateCategory);
adminRouter.post('/products', menuController.createProduct);
adminRouter.put('/products/:id', menuController.updateProduct);
adminRouter.patch('/products/:id/toggle', menuController.toggleProductActive);
adminRouter.delete('/products/:id', menuController.deleteProduct);

// Operação de Pedidos Admin (API-009, API-010, API-011)
adminRouter.get('/orders', orderController.listAdminOrders);
adminRouter.get('/metrics', orderController.getMetrics);
adminRouter.post('/orders/simulate', orderController.simulateIncomingOrder);
adminRouter.post('/orders/reset', orderController.resetDemoOrders);
adminRouter.patch('/orders/:id/advance', orderController.advanceOrderByAdmin);
adminRouter.post('/orders/:id/cancel', orderController.cancelOrderByAdmin);

// Gestão de Usuários e Acessos ao Sistema (SQLite)
adminRouter.get('/users', userController.listUsers);
adminRouter.get('/users/:id', userController.getUserById);
adminRouter.post('/users', userController.createUser);
adminRouter.put('/users/:id', userController.updateUser);
adminRouter.patch('/users/:id/toggle', userController.toggleUserActive);
adminRouter.delete('/users/:id', userController.deleteUser);
