import { userService } from '../services/userService.js';

export const userController = {
  /**
   * GET /api/admin/users
   */
  listUsers(_req, res, next) {
    try {
      const result = userService.listUsers();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/users/:id
   */
  getUserById(req, res, next) {
    try {
      const result = userService.getUserById(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/users
   */
  createUser(req, res, next) {
    try {
      const result = userService.createUser(req.body || {});
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/users/:id
   */
  updateUser(req, res, next) {
    try {
      const currentUserId = req.user?.id || req.user?.sub;
      const result = userService.updateUser(req.params.id, req.body || {}, currentUserId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id/toggle
   */
  toggleUserActive(req, res, next) {
    try {
      const currentUserId = req.user?.id || req.user?.sub;
      const result = userService.toggleUserActive(req.params.id, currentUserId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   */
  deleteUser(req, res, next) {
    try {
      const currentUserId = req.user?.id || req.user?.sub;
      const result = userService.deleteUser(req.params.id, currentUserId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
