import { AppError } from '../middlewares/errorHandler.js';
import {
  bannerRepo,
  INITIAL_DEFAULT_BANNERS,
} from '../repositories/bannerRepo.js';

function validateBannerInput(
  { title, photoUrl, sortOrder },
  isUpdate = false
) {
  if (!isUpdate || title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError(
        'O título do banner é obrigatório.',
        422,
        'VALIDATION_ERROR'
      );
    }
  }

  if (!isUpdate || photoUrl !== undefined) {
    if (
      !photoUrl ||
      typeof photoUrl !== 'string' ||
      photoUrl.trim().length === 0
    ) {
      throw new AppError(
        'A URL da imagem do banner é obrigatória.',
        422,
        'VALIDATION_ERROR'
      );
    }
  }

  if (sortOrder !== undefined) {
    const num = Number(sortOrder);
    if (!Number.isInteger(num) || num < 0) {
      throw new AppError(
        'A ordem de exibição do banner deve ser um número inteiro maior ou igual a zero.',
        422,
        'VALIDATION_ERROR'
      );
    }
  }
}

export const bannerService = {
  getPublicBanners() {
    let list = bannerRepo.findAll({ onlyActive: true });
    // Se a tabela estiver vazia, semeia os padrões para garantir funcionamento
    if (list.length === 0) {
      list = bannerRepo.resetDefaults().filter((b) => Boolean(b.active));
    }
    return { banners: list };
  },

  getAdminBanners() {
    let list = bannerRepo.findAll({ onlyActive: false });
    if (list.length === 0) {
      list = bannerRepo.resetDefaults();
    }
    return { banners: list };
  },

  getBannerById(id) {
    const banner = bannerRepo.findById(id);
    if (!banner) {
      throw new AppError('Banner não encontrado.', 404, 'BANNER_NOT_FOUND');
    }
    return banner;
  },

  createBanner(payload) {
    validateBannerInput(payload, false);
    return bannerRepo.create(payload);
  },

  updateBanner(id, payload) {
    const banner = bannerRepo.findById(id);
    if (!banner) {
      throw new AppError('Banner não encontrado.', 404, 'BANNER_NOT_FOUND');
    }

    validateBannerInput(payload, true);
    return bannerRepo.update(id, payload);
  },

  toggleBannerActive(id, explicitActive) {
    const banner = bannerRepo.findById(id);
    if (!banner) {
      throw new AppError('Banner não encontrado.', 404, 'BANNER_NOT_FOUND');
    }
    return bannerRepo.toggleActive(id, explicitActive);
  },

  deleteBanner(id) {
    const banner = bannerRepo.findById(id);
    if (!banner) {
      throw new AppError('Banner não encontrado.', 404, 'BANNER_NOT_FOUND');
    }
    bannerRepo.delete(id);
    return { success: true, message: 'Banner excluído com sucesso.' };
  },

  resetDefaults() {
    const list = bannerRepo.resetDefaults();
    return {
      success: true,
      message: 'Banners padrão restaurados com sucesso.',
      banners: list,
    };
  },
};
