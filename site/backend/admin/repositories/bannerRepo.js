import { asc, eq } from 'drizzle-orm';
import { getDb, getSqlite } from '../../db/connection.js';
import { banners } from '../../db/schema.js';

export const INITIAL_DEFAULT_BANNERS = [
  {
    title: 'Cortes Nobres & Artisan Burgers',
    subtitle:
      'Blends nobres 180g preparados no fogo com queijo cheddar fundido, batatas crocantes e molhos autorais da casa.',
    badge: 'EXPERIÊNCIA EXCLUSIVA FOODEXPRESS',
    tag: 'AGORA TEM O VERDADEIRO SABOR DA BRASA',
    schedule: 'TERÇA A DOMINGO DAS 18H00 ÀS 23H30 · SALÃO & DELIVERY',
    ctaText: 'VER CARDÁPIO COMPLETO',
    ctaSubtext: 'FAZER MEU PEDIDO AGORA',
    photoUrl:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=900&fit=crop',
    photoAlt:
      'Mesa repleta de hambúrgueres artesanais, porções e amigos comemorando no FoodExpress',
    active: true,
    sortOrder: 1,
  },
  {
    title: "Aussie Fries & Bloomin' Onion",
    subtitle:
      'Batatas rústicas com cheddar cremoso e bacon crocante, anéis de cebola dourados e molhos especiais para mergulhar.',
    badge: 'FESTIVAL DE COMBOS & PORÇÕES',
    tag: 'PORÇÕES GENEROSAS PARA COMPARTILHAR',
    schedule: 'O ACOMPANHAMENTO PERFEITO PARA QUALQUER PEDIDO',
    ctaText: 'VER NOSSOS PRODUTOS',
    ctaSubtext: 'VER PORÇÕES DISPONÍVEIS',
    photoUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=900&fit=crop',
    photoAlt: 'Costela grelhada com batatas rústicas e porções generosas na mesa',
    active: true,
    sortOrder: 2,
  },
  {
    title: 'Thunder Brownie com Sorvete',
    subtitle:
      'Brownie quente de chocolate denso com cobertura de ganache artesanal e bola generosa de sorvete de baunilha.',
    badge: 'DOCE ENCERRAMENTO DA NOITE',
    tag: 'A EXPERIÊNCIA COMPLETA DO STEAKHOUSE',
    schedule: 'A SOBREMESA MAIS AMADA E COMENTADA DA CASA',
    ctaText: 'EXPERIMENTAR SOBREMESA',
    ctaSubtext: 'CARDÁPIO DE DOCES & BEBIDAS',
    photoUrl:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1200&h=900&fit=crop',
    photoAlt:
      'Delicioso brownie quente com calda de chocolate e sorvete artesanal',
    active: true,
    sortOrder: 3,
  },
];

export const bannerRepo = {
  findAll({ onlyActive = false } = {}) {
    const db = getDb();
    const query = db
      .select()
      .from(banners)
      .orderBy(asc(banners.sortOrder), asc(banners.id));

    const all = query.all();
    if (onlyActive) {
      return all.filter((b) => Boolean(b.active));
    }
    return all;
  },

  findById(id) {
    const db = getDb();
    return (
      db
        .select()
        .from(banners)
        .where(eq(banners.id, Number(id)))
        .get() || null
    );
  },

  create({
    title,
    subtitle = '',
    badge = '',
    tag = '',
    schedule = '',
    ctaText = 'VER CARDÁPIO COMPLETO',
    ctaSubtext = '',
    photoUrl,
    photoAlt = '',
    active = true,
    sortOrder = 0,
  }) {
    const db = getDb();
    const now = new Date().toISOString();

    return db
      .insert(banners)
      .values({
        title,
        subtitle,
        badge,
        tag,
        schedule,
        ctaText,
        ctaSubtext,
        photoUrl,
        photoAlt,
        active: Boolean(active),
        sortOrder: Number(sortOrder),
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  },

  update(
    id,
    {
      title,
      subtitle,
      badge,
      tag,
      schedule,
      ctaText,
      ctaSubtext,
      photoUrl,
      photoAlt,
      active,
      sortOrder,
    }
  ) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    const now = new Date().toISOString();

    return db
      .update(banners)
      .set({
        title: title !== undefined ? title : current.title,
        subtitle: subtitle !== undefined ? subtitle : current.subtitle,
        badge: badge !== undefined ? badge : current.badge,
        tag: tag !== undefined ? tag : current.tag,
        schedule: schedule !== undefined ? schedule : current.schedule,
        ctaText: ctaText !== undefined ? ctaText : current.ctaText,
        ctaSubtext: ctaSubtext !== undefined ? ctaSubtext : current.ctaSubtext,
        photoUrl: photoUrl !== undefined ? photoUrl : current.photoUrl,
        photoAlt: photoAlt !== undefined ? photoAlt : current.photoAlt,
        active: active !== undefined ? Boolean(active) : current.active,
        sortOrder:
          sortOrder !== undefined ? Number(sortOrder) : current.sortOrder,
        updatedAt: now,
      })
      .where(eq(banners.id, Number(id)))
      .returning()
      .get();
  },

  toggleActive(id, explicitActive) {
    const current = this.findById(id);
    if (!current) return null;

    const nextState =
      explicitActive !== undefined ? Boolean(explicitActive) : !current.active;

    return this.update(id, { active: nextState });
  },

  delete(id) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return false;

    db.delete(banners).where(eq(banners.id, Number(id))).run();
    return true;
  },

  resetDefaults() {
    const sqlite = getSqlite();
    sqlite.exec('DELETE FROM banners;');

    for (const b of INITIAL_DEFAULT_BANNERS) {
      this.create(b);
    }
    return this.findAll();
  },
};
