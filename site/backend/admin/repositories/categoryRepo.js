import { asc, eq } from 'drizzle-orm';
import { getDb, getSqlite } from '../../db/connection.js';
import {
  categories,
  productAddons,
  products,
  productVariations,
} from '../../db/schema.js';

export const categoryRepo = {
  findAll({ onlyActive = false } = {}) {
    const db = getDb();
    const query = db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder), asc(categories.id));

    const all = query.all();
    if (onlyActive) {
      return all.filter((c) => Boolean(c.active));
    }
    return all;
  },

  findById(id) {
    const db = getDb();
    return (
      db
        .select()
        .from(categories)
        .where(eq(categories.id, Number(id)))
        .get() || null
    );
  },

  create({ name, displayOrder = 0, active = true }) {
    const db = getDb();
    return db
      .insert(categories)
      .values({
        name,
        displayOrder: Number(displayOrder),
        active: Boolean(active),
      })
      .returning()
      .get();
  },

  update(id, { name, displayOrder, active }) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    return db
      .update(categories)
      .set({
        name: name !== undefined ? name : current.name,
        displayOrder:
          displayOrder !== undefined
            ? Number(displayOrder)
            : current.displayOrder,
        active: active !== undefined ? Boolean(active) : current.active,
      })
      .where(eq(categories.id, Number(id)))
      .returning()
      .get();
  },

  toggleActive(id, explicitActive = undefined) {
    const current = this.findById(id);
    if (!current) return null;
    const nextActive =
      explicitActive !== undefined ? Boolean(explicitActive) : !current.active;
    return this.update(id, { active: nextActive });
  },

  delete(id) {
    const db = getDb();
    const sqlite = getSqlite();
    const current = this.findById(id);
    if (!current) return false;

    const tx = sqlite.transaction(() => {
      const catProducts = db
        .select()
        .from(products)
        .where(eq(products.categoryId, Number(id)))
        .all();

      for (const prod of catProducts) {
        db.delete(productVariations)
          .where(eq(productVariations.productId, prod.id))
          .run();
        db.delete(productAddons)
          .where(eq(productAddons.productId, prod.id))
          .run();
      }

      db.delete(products).where(eq(products.categoryId, Number(id))).run();
      db.delete(categories).where(eq(categories.id, Number(id))).run();
    });

    tx();
    return true;
  },
};
