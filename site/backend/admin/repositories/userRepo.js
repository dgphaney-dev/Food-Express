import { asc, desc, eq } from 'drizzle-orm';
import { getDb } from '../../db/connection.js';
import { users } from '../../db/schema.js';

export const userRepo = {
  findAll() {
    const db = getDb();
    const rows = db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        phone: users.phone,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(asc(users.id))
      .all();
    return rows;
  },

  findById(id) {
    const db = getDb();
    const numericId = Number(id);
    const rows = db.select().from(users).where(eq(users.id, numericId)).all();
    return rows[0] || null;
  },

  findByUsername(username) {
    const db = getDb();
    const rows = db
      .select()
      .from(users)
      .where(eq(users.username, String(username).toLowerCase().trim()))
      .all();
    return rows[0] || null;
  },

  create({ name = '', username, passwordHash, role = 'ADMIN', phone = null, active = true }) {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .insert(users)
      .values({
        name: name ? String(name).trim() : '',
        username: String(username).toLowerCase().trim(),
        passwordHash,
        role: role || 'ADMIN',
        phone: phone ? String(phone).trim() : null,
        active: active !== false,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        phone: users.phone,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .get();
    return result;
  },

  update(id, fields = {}) {
    const db = getDb();
    const numericId = Number(id);
    const updatePayload = {
      updatedAt: new Date().toISOString(),
    };

    if (fields.name !== undefined) updatePayload.name = String(fields.name).trim();
    if (fields.username !== undefined) updatePayload.username = String(fields.username).toLowerCase().trim();
    if (fields.passwordHash !== undefined) updatePayload.passwordHash = fields.passwordHash;
    if (fields.role !== undefined) updatePayload.role = fields.role;
    if (fields.phone !== undefined) updatePayload.phone = fields.phone ? String(fields.phone).trim() : null;
    if (fields.active !== undefined) updatePayload.active = Boolean(fields.active);

    const result = db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, numericId))
      .returning({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        phone: users.phone,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .get();
    return result;
  },

  delete(id) {
    const db = getDb();
    const numericId = Number(id);
    const deleted = db.delete(users).where(eq(users.id, numericId)).returning().get();
    return deleted;
  },

  count() {
    const db = getDb();
    const rows = db.select({ id: users.id }).from(users).all();
    return rows.length;
  },
};
