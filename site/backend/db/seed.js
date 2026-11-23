import { env } from '../config/env.js';
import { categoryRepo } from '../admin/repositories/categoryRepo.js';
import { productRepo } from '../admin/repositories/productRepo.js';
import { userRepo } from '../admin/repositories/userRepo.js';
import { bannerRepo } from '../admin/repositories/bannerRepo.js';
import { hashPassword } from '../admin/services/authService.js';

export function seedDatabase() {
  // 1. Administrador Principal (criado apenas se ainda não existir)
  const existingAdmin = userRepo.findByUsername(env.ADMIN_DEFAULT_USER);
  if (!existingAdmin) {
    userRepo.create({
      name: 'Administrador',
      username: env.ADMIN_DEFAULT_USER,
      passwordHash: hashPassword(env.ADMIN_DEFAULT_PASS),
      role: 'ADMIN',
      phone: '',
      active: true,
    });
  } else if (!existingAdmin.name) {
    userRepo.update(existingAdmin.id, {
      name: 'Administrador',
    });
  }

  // 2. Categorias e Produtos Base (criados apenas se o cardápio estiver vazio)
  const existingCategories = categoryRepo.findAll();
  if (existingCategories.length === 0) {
    const catBurgers = categoryRepo.create({
      name: 'Lanches',
      displayOrder: 1,
      active: true,
    });
    const catSides = categoryRepo.create({
      name: 'Porções',
      displayOrder: 2,
      active: true,
    });
    const catDrinks = categoryRepo.create({
      name: 'Bebidas',
      displayOrder: 3,
      active: true,
    });
    const catDesserts = categoryRepo.create({
      name: 'Sobremesas',
      displayOrder: 4,
      active: true,
    });

    productRepo.create({
      categoryId: catBurgers.id,
      name: 'X-Burger Artesanal',
      description:
        'Pão brioche, hambúrguer 180g, queijo cheddar, alface, tomate e molho especial.',
      basePrice: 28.9,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      active: true,
      variations: [
        { name: 'Simples', price: 28.9, active: true },
        { name: 'Duplo', price: 36.9, active: true },
        { name: 'Triplo', price: 44.9, active: true },
      ],
      addons: [
        { name: 'Bacon Extra', price: 5.0, active: true },
        { name: 'Cheddar Extra', price: 4.0, active: true },
        { name: 'Ovo', price: 3.0, active: true },
        { name: 'Onion Rings', price: 6.0, active: true },
      ],
    });

    productRepo.create({
      categoryId: catBurgers.id,
      name: 'X-Salada',
      description:
        'Pão tradicional, hambúrguer 150g, queijo, alface, tomate, cebola e maionese.',
      basePrice: 22.9,
      imageUrl:
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
      active: true,
      variations: [
        { name: 'Simples', price: 22.9, active: true },
        { name: 'Duplo', price: 30.9, active: true },
      ],
      addons: [
        { name: 'Bacon Extra', price: 5.0, active: true },
        { name: 'Queijo Extra', price: 3.5, active: true },
      ],
    });

    productRepo.create({
      categoryId: catBurgers.id,
      name: 'Frango Crispy',
      description:
        'Pão com gergelim, filé de frango empanado crocante, alface americana e maionese temperada.',
      basePrice: 25.9,
      imageUrl:
        'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop',
      active: true,
      variations: [],
      addons: [
        { name: 'Cheddar', price: 4.0, active: true },
        { name: 'Bacon', price: 5.0, active: true },
      ],
    });

    productRepo.create({
      categoryId: catSides.id,
      name: 'Batata Frita',
      description:
        'Porção generosa de batatas fritas crocantes com sal e temperos.',
      basePrice: 18.9,
      imageUrl:
        'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
      active: true,
      variations: [
        { name: 'Pequena', price: 14.9, active: true },
        { name: 'Média', price: 18.9, active: true },
        { name: 'Grande', price: 24.9, active: true },
      ],
      addons: [
        { name: 'Cheddar', price: 5.0, active: true },
        { name: 'Bacon', price: 6.0, active: true },
      ],
    });

    productRepo.create({
      categoryId: catSides.id,
      name: 'Nuggets (10 un)',
      description:
        '10 unidades de nuggets crocantes de frango com molho barbecue.',
      basePrice: 19.9,
      imageUrl:
        'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop',
      active: true,
      variations: [],
      addons: [{ name: 'Molho Extra', price: 2.0, active: true }],
    });

    productRepo.create({
      categoryId: catSides.id,
      name: 'Onion Rings',
      description:
        'Anéis de cebola empanados e crocantes com molho ranch especial.',
      basePrice: 16.9,
      imageUrl:
        'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
      active: true,
      variations: [],
      addons: [],
    });

    productRepo.create({
      categoryId: catDrinks.id,
      name: 'Refrigerante Lata',
      description:
        'Coca-Cola, Guaraná Antarctica, Fanta ou Sprite. Servido bem gelado.',
      basePrice: 7.9,
      imageUrl:
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=450&fit=crop',
      active: true,
      variations: [
        { name: 'Lata 350ml', price: 7.9, active: true },
        { name: '600ml', price: 9.9, active: true },
        { name: '2L', price: 13.9, active: true },
      ],
      addons: [],
    });

    productRepo.create({
      categoryId: catDrinks.id,
      name: 'Chopp Artesanal Caneca Congelada',
      description:
        'Chopp pilsen puro malte artesanal tirado no padrão perfeito e servido na caneca ultracongelada com colarinho cremoso.',
      basePrice: 11.9,
      imageUrl:
        'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=450&fit=crop',
      active: true,
      variations: [
        { name: 'Caneca 340ml', price: 11.9, active: true },
        { name: 'Canecão 500ml', price: 16.9, active: true },
      ],
      addons: [],
    });

    productRepo.create({
      categoryId: catDrinks.id,
      name: 'Suco Natural',
      description:
        'Laranja, limão, maracujá ou abacaxi. Feito na hora com frutas frescas.',
      basePrice: 10.9,
      imageUrl:
        'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&h=450&fit=crop',
      active: true,
      variations: [
        { name: '300ml', price: 10.9, active: true },
        { name: '500ml', price: 14.9, active: true },
      ],
      addons: [],
    });

    productRepo.create({
      categoryId: catDrinks.id,
      name: 'Água Mineral',
      description: 'Água mineral sem gás ou com gás 500ml.',
      basePrice: 4.9,
      imageUrl:
        'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=450&fit=crop',
      active: true,
      variations: [],
      addons: [],
    });

    productRepo.create({
      categoryId: catDesserts.id,
      name: 'Thunder Brownie com Sorvete',
      description:
        'Brownie morno de chocolate belga denso com calda quente cremosa e bola generosa de sorvete de baunilha.',
      basePrice: 19.9,
      imageUrl:
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=450&fit=crop',
      active: true,
      variations: [],
      addons: [
        { name: 'Bola Extra de Sorvete', price: 5.0, active: true },
        { name: 'Calda Extra de Chocolate', price: 3.0, active: true },
      ],
    });

    productRepo.create({
      categoryId: catDesserts.id,
      name: 'Pudim Artesanal de Leite',
      description:
        'Pudim tradicional de leite condensado super cremoso e lisinho com calda de caramelo brilhante.',
      basePrice: 12.9,
      imageUrl:
        'https://images.unsplash.com/photo-1532556660262-1c45d5fae825?w=600&h=450&fit=crop',
      active: true,
      variations: [],
      addons: [],
    });

    productRepo.create({
      categoryId: catDesserts.id,
      name: 'Milkshake',
      description:
        'Milkshake cremoso. Sabores: Chocolate Belga, Morango Silvestre ou Ovomaltine Crocante.',
      basePrice: 16.9,
      imageUrl:
        'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=450&fit=crop',
      active: true,
      variations: [
        { name: '300ml', price: 16.9, active: true },
        { name: '500ml', price: 22.9, active: true },
      ],
      addons: [
        { name: 'Chantilly', price: 3.0, active: true },
        { name: 'Calda Extra', price: 2.5, active: true },
      ],
    });
  }

  // 3. Banners do Hero (Carrossel Inicial, criado apenas se a tabela estiver vazia)
  const existingBanners = bannerRepo.findAll();
  if (existingBanners.length === 0) {
    bannerRepo.resetDefaults();
  }
}
