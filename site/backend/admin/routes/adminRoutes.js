import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { menuController } from '../controllers/menuController.js';
import { orderController } from '../controllers/orderController.js';
import { userController } from '../controllers/userController.js';
import { bannerController } from '../controllers/bannerController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export const authRouter = Router();
authRouter.post('/login', authController.login);
authRouter.get('/me', authMiddleware, authController.me);

export const adminRouter = Router();
adminRouter.use(authMiddleware);

// Gestão de Banners do Hero
adminRouter.get('/banners', bannerController.getAdminBanners);
adminRouter.get('/banners/:id', bannerController.getBannerById);
adminRouter.post('/banners', bannerController.createBanner);
adminRouter.put('/banners/:id', bannerController.updateBanner);
adminRouter.patch('/banners/:id/toggle', bannerController.toggleBannerActive);
adminRouter.delete('/banners/:id', bannerController.deleteBanner);
adminRouter.post('/banners/reset-defaults', bannerController.resetDefaults);

// Cardápio Admin (API-006, API-007, API-008)
adminRouter.get('/menu', menuController.getAdminMenu);
adminRouter.post('/categories', menuController.createCategory);
adminRouter.put('/categories/:id', menuController.updateCategory);
adminRouter.patch('/categories/:id/toggle', menuController.toggleCategoryActive);
adminRouter.delete('/categories/:id', menuController.deleteCategory);
adminRouter.post('/products', menuController.createProduct);
adminRouter.put('/products/:id', menuController.updateProduct);
adminRouter.patch('/products/:id/toggle', menuController.toggleProductActive);
adminRouter.delete('/products/:id', menuController.deleteProduct);

// Operação de Pedidos Admin (API-009, API-010, API-011)
adminRouter.get('/orders', orderController.listAdminOrders);
adminRouter.get('/metrics', orderController.getMetrics);
adminRouter.patch('/orders/:id/advance', orderController.advanceOrderByAdmin);
adminRouter.post('/orders/:id/cancel', orderController.cancelOrderByAdmin);

// Gestão de Usuários e Acessos ao Sistema (SQLite)
adminRouter.get('/users', userController.listUsers);
adminRouter.get('/users/:id', userController.getUserById);
adminRouter.post('/users', userController.createUser);
adminRouter.put('/users/:id', userController.updateUser);
adminRouter.patch('/users/:id/toggle', userController.toggleUserActive);
adminRouter.delete('/users/:id', userController.deleteUser);
