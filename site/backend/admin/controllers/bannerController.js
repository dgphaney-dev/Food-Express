import { bannerService } from '../services/bannerService.js';

export const bannerController = {
  /**
   * GET /api/public/banners
   */
  getPublicBanners(_req, res, next) {
    try {
      const result = bannerService.getPublicBanners();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/banners
   */
  getAdminBanners(_req, res, next) {
    try {
      const result = bannerService.getAdminBanners();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/banners/:id
   */
  getBannerById(req, res, next) {
    try {
      const banner = bannerService.getBannerById(req.params.id);
      res.status(200).json({ banner });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/banners
   */
  createBanner(req, res, next) {
    try {
      const banner = bannerService.createBanner(req.body || {});
      res.status(201).json({ banner });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/banners/:id
   */
  updateBanner(req, res, next) {
    try {
      const banner = bannerService.updateBanner(req.params.id, req.body || {});
      res.status(200).json({ banner });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/banners/:id/toggle
   */
  toggleBannerActive(req, res, next) {
    try {
      const explicitActive =
        req.body && req.body.active !== undefined ? req.body.active : undefined;
      const banner = bannerService.toggleBannerActive(
        req.params.id,
        explicitActive
      );
      res.status(200).json({ banner });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/banners/:id
   */
  deleteBanner(req, res, next) {
    try {
      const result = bannerService.deleteBanner(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/banners/reset-defaults
   */
  resetDefaults(_req, res, next) {
    try {
      const result = bannerService.resetDefaults();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
