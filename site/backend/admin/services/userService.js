import { AppError } from '../middlewares/errorHandler.js';
import { userRepo } from '../repositories/userRepo.js';
import { hashPassword } from './authService.js';

const ALLOWED_ROLES = ['ADMIN', 'ATENDENTE', 'COZINHA', 'ENTREGADOR'];

export const userService = {
  listUsers() {
    return {
      users: userRepo.findAll(),
      serverTime: new Date().toISOString(),
    };
  },

  getUserById(id) {
    const user = userRepo.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado no sistema.', 404, 'USER_NOT_FOUND');
    }
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser };
  },

  createUser({ name = '', username, password, role = 'ATENDENTE', phone = null, active = true }) {
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new AppError(
        'O nome de usuário deve ter no mínimo 3 caracteres.',
        400,
        'INVALID_USERNAME'
      );
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
      throw new AppError(
        'O usuário deve conter apenas letras, números, pontos ou traços.',
        400,
        'INVALID_USERNAME_FORMAT'
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new AppError(
        'A senha deve ter no mínimo 6 caracteres.',
        400,
        'WEAK_PASSWORD'
      );
    }

    const existing = userRepo.findByUsername(cleanUsername);
    if (existing) {
      throw new AppError(
        `O nome de usuário "${cleanUsername}" já está em uso. Escolha outro.`,
        409,
        'USERNAME_ALREADY_EXISTS'
      );
    }

    const finalRole = ALLOWED_ROLES.includes(role) ? role : 'ATENDENTE';
    const pwdHash = hashPassword(password);

    const created = userRepo.create({
      name: name ? String(name).trim() : cleanUsername,
      username: cleanUsername,
      passwordHash: pwdHash,
      role: finalRole,
      phone: phone ? String(phone).trim() : null,
      active: active !== false,
    });

    return { user: created, success: true };
  },

  updateUser(id, fields = {}, currentUserId = null) {
    const existing = userRepo.findById(id);
    if (!existing) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    const updatePayload = {};

    if (fields.name !== undefined) {
      updatePayload.name = String(fields.name).trim();
    }

    if (fields.username !== undefined) {
      const cleanUsername = String(fields.username).toLowerCase().trim();
      if (cleanUsername.length < 3 || !/^[a-z0-9._-]+$/.test(cleanUsername)) {
        throw new AppError(
          'O usuário deve conter no mínimo 3 caracteres válidos.',
          400,
          'INVALID_USERNAME'
        );
      }
      if (cleanUsername !== existing.username) {
        const check = userRepo.findByUsername(cleanUsername);
        if (check) {
          throw new AppError(
            `O usuário "${cleanUsername}" já está cadastrado.`,
            409,
            'USERNAME_ALREADY_EXISTS'
          );
        }
        updatePayload.username = cleanUsername;
      }
    }

    if (fields.password && typeof fields.password === 'string') {
      if (fields.password.length < 6) {
        throw new AppError('A nova senha deve ter no mínimo 6 caracteres.', 400, 'WEAK_PASSWORD');
      }
      updatePayload.passwordHash = hashPassword(fields.password);
    }

    if (fields.role !== undefined) {
      if (!ALLOWED_ROLES.includes(fields.role)) {
        throw new AppError('Perfil de acesso inválido.', 400, 'INVALID_ROLE');
      }
      // Se estiver rebaixando o único admin
      if (existing.role === 'ADMIN' && fields.role !== 'ADMIN') {
        const all = userRepo.findAll();
        const adminCount = all.filter((u) => u.role === 'ADMIN' && u.active).length;
        if (adminCount <= 1) {
          throw new AppError(
            'Não é permitido alterar o perfil do único Administrador ativo.',
            400,
            'CANNOT_DEMOTE_LAST_ADMIN'
          );
        }
      }
      updatePayload.role = fields.role;
    }

    if (fields.phone !== undefined) {
      updatePayload.phone = fields.phone ? String(fields.phone).trim() : null;
    }

    if (fields.active !== undefined) {
      const targetActive = Boolean(fields.active);
      if (!targetActive && existing.role === 'ADMIN') {
        const all = userRepo.findAll();
        const activeAdmins = all.filter((u) => u.role === 'ADMIN' && u.active);
        if (activeAdmins.length <= 1) {
          throw new AppError(
            'Não é possível desativar o único Administrador ativo do sistema.',
            400,
            'CANNOT_DEACTIVATE_LAST_ADMIN'
          );
        }
      }
      updatePayload.active = targetActive;
    }

    const updated = userRepo.update(id, updatePayload);
    return { user: updated, success: true };
  },

  toggleUserActive(id, currentUserId = null) {
    const existing = userRepo.findById(id);
    if (!existing) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    const nextActive = !existing.active;
    if (!nextActive && existing.role === 'ADMIN') {
      const all = userRepo.findAll();
      const activeAdmins = all.filter((u) => u.role === 'ADMIN' && u.active);
      if (activeAdmins.length <= 1) {
        throw new AppError(
          'Não é permitido inativar o único Administrador ativo.',
          400,
          'CANNOT_DEACTIVATE_LAST_ADMIN'
        );
      }
    }

    const updated = userRepo.update(id, { active: nextActive });
    return { user: updated, success: true };
  },

  deleteUser(id, currentUserId = null) {
    const numericId = Number(id);
    const existing = userRepo.findById(numericId);
    if (!existing) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    if (currentUserId && Number(currentUserId) === numericId) {
      throw new AppError(
        'Você não pode excluir sua própria conta enquanto estiver conectado.',
        400,
        'CANNOT_DELETE_SELF'
      );
    }

    if (existing.role === 'ADMIN') {
      const all = userRepo.findAll();
      const adminCount = all.filter((u) => u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        throw new AppError(
          'Não é permitido remover o único Administrador do sistema.',
          400,
          'CANNOT_DELETE_LAST_ADMIN'
        );
      }
    }

    userRepo.delete(numericId);
    return { success: true, deletedId: numericId };
  },
};
