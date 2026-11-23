import { orderService } from '../services/orderService.js';

export const orderController = {
  /**
   * API-009: GET /api/admin/orders
   */
  listAdminOrders(req, res, next) {
    try {
      const status = req.query.status ? String(req.query.status) : null;
      const result = orderService.listAdminOrders({ status });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * API-010: PATCH /api/admin/orders/:id/advance
   */
  advanceOrderByAdmin(req, res, next) {
    try {
      const targetStatus = req.body?.targetStatus || null;
      const result = orderService.advanceOrderByAdmin(
        req.params.id,
        targetStatus
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * API-011: POST /api/admin/orders/:id/cancel
   */
  cancelOrderByAdmin(req, res, next) {
    try {
      const result = orderService.cancelOrderByAdmin(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/public/orders
   */
  createCustomerOrder(req, res, next) {
    try {
      const result = orderService.createCustomerOrder(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/public/orders/:id
   */
  getOrderById(req, res, next) {
    try {
      const result = orderService.getOrderById(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/public/orders/:id/pay
   */
  markOrderAsPaid(req, res, next) {
    try {
      const paymentMethod = req.body?.paymentMethod || 'PIX';
      const result = orderService.markOrderAsPaid(req.params.id, paymentMethod);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/public/orders/:id/cancel
   */
  cancelOrderByCustomer(req, res, next) {
    try {
      const result = orderService.cancelOrderByCustomer(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/driver/orders
   */
  listDriverOrders(_req, res, next) {
    try {
      const result = orderService.listDriverOrders();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/driver/orders/:id/confirm-pin
   */
  confirmDriverPin(req, res, next) {
    try {
      const pin = req.body?.pin;
      const result = orderService.confirmDriverPin(req.params.id, pin);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/metrics
   */
  getMetrics(req, res, next) {
    try {
      const period = req.query.period ? String(req.query.period) : 'today';
      const result = orderService.getMetrics({ period });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
