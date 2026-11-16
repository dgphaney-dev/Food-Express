import { env } from '../config/env.js';
import { categoryRepo } from '../admin/repositories/categoryRepo.js';
import { orderRepo } from '../admin/repositories/orderRepo.js';
import { productRepo } from '../admin/repositories/productRepo.js';
import { userRepo } from '../admin/repositories/userRepo.js';
import { hashPassword } from '../admin/services/authService.js';
import { getSqlite } from './connection.js';

const minutesAgo = (mins) =>
  new Date(Date.now() - mins * 60 * 1000).toISOString();

const daysAgo = (days, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();

export const INITIAL_SEED_ORDERS = () => [
  {
    order: {
      id: 101,
      orderType: 'DINE_IN',
      status: 'RECEIVED',
      tableNumber: '12',
      customerName: null,
      deliveryAddress: null,
      totalAmount: 68.9,
      createdAt: minutesAgo(2),
      updatedAt: minutesAgo(2),
    },
    items: [
      {
        productNameSnapshot: 'X-Burger Artesanal',
        quantity: 2,
        variationNameSnapshot: 'Duplo (2x 160g)',
        addonsSnapshot: [
          { name: 'Bacon Extra', price: 5.0 },
          { name: 'Cheddar Inglês', price: 4.5 },
        ],
        notes: 'Sem cebola em um deles, maionese verde à parte',
        unitPrice: 30.5,
        subtotal: 61.0,
      },
      {
        productNameSnapshot: 'Refrigerante Lata',
        quantity: 1,
        variationNameSnapshot: 'Coca-Cola Zero 350ml',
        addonsSnapshot: [],
        notes: 'Com gelo e limão',
        unitPrice: 7.9,
        subtotal: 7.9,
      },
    ],
  },
  {
    order: {
      id: 102,
      orderType: 'DELIVERY',
      status: 'RECEIVED',
      tableNumber: null,
      customerName: 'Mariana Costa',
      deliveryAddress: 'Rua das Palmeiras, 450 - Apto 32 (Bloco B)',
      totalAmount: 54.0,
      createdAt: minutesAgo(6),
      updatedAt: minutesAgo(6),
    },
    items: [
      {
        productNameSnapshot: 'Smash Crispy Bacon',
        quantity: 1,
        variationNameSnapshot: 'Triplo Smash',
        addonsSnapshot: [{ name: 'Queijo Prato Extra', price: 4.0 }],
        notes: 'Bem passado, por favor',
        unitPrice: 38.0,
        subtotal: 38.0,
      },
      {
        productNameSnapshot: 'Batata Frita Rústica',
        quantity: 1,
        variationNameSnapshot: 'Média (300g)',
        addonsSnapshot: [{ name: 'Alecrim e Páprica', price: 2.0 }],
        notes: '',
        unitPrice: 16.0,
        subtotal: 16.0,
      },
    ],
  },
  {
    order: {
      id: 103,
      orderType: 'DINE_IN',
      status: 'PREPARING',
      tableNumber: '04',
      customerName: null,
      deliveryAddress: null,
      totalAmount: 42.5,
      createdAt: minutesAgo(14),
      updatedAt: minutesAgo(9),
    },
    items: [
      {
        productNameSnapshot: 'Combo Frango Crocante',
        quantity: 1,
        variationNameSnapshot: 'Tradicional',
        addonsSnapshot: [{ name: 'Molho Honey Mustard', price: 3.5 }],
        notes: 'Pouco sal na batata',
        unitPrice: 42.5,
        subtotal: 42.5,
      },
    ],
  },
  {
    order: {
      id: 104,
      orderType: 'DELIVERY',
      status: 'READY',
      tableNumber: null,
      customerName: 'Carlos Eduardo',
      deliveryAddress: 'Av. Brasil, 1200 - Portaria Principal',
      totalAmount: 89.8,
      createdAt: minutesAgo(25),
      updatedAt: minutesAgo(3),
    },
    items: [
      {
        productNameSnapshot: 'X-Salada Clássico',
        quantity: 2,
        variationNameSnapshot: 'Padrão 180g',
        addonsSnapshot: [{ name: 'Ovo Caipira', price: 3.0 }],
        notes: 'Ponto para mal passado',
        unitPrice: 34.9,
        subtotal: 69.8,
      },
      {
        productNameSnapshot: 'Suco Natural',
        quantity: 2,
        variationNameSnapshot: 'Laranja 500ml',
        addonsSnapshot: [],
        notes: 'Sem açúcar',
        unitPrice: 10.0,
        subtotal: 20.0,
      },
    ],
  },
  {
    order: {
      id: 105,
      orderType: 'DINE_IN',
      status: 'DELIVERED',
      tableNumber: '08',
      customerName: null,
      deliveryAddress: null,
      totalAmount: 31.0,
      createdAt: minutesAgo(42),
      updatedAt: minutesAgo(18),
    },
    items: [
      {
        productNameSnapshot: 'Classic Cheeseburger',
        quantity: 1,
        variationNameSnapshot: 'Simples',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 31.0,
        subtotal: 31.0,
      },
    ],
  },
  {
    order: {
      id: 106,
      orderType: 'DELIVERY',
      status: 'DELIVERED',
      tableNumber: null,
      customerName: 'Renata Albuquerque',
      deliveryAddress: 'Rua Bela Vista, 88 - Jardins',
      totalAmount: 142.5,
      createdAt: daysAgo(2, 4),
      updatedAt: daysAgo(2, 3),
    },
    items: [
      {
        productNameSnapshot: 'Picanha Steakhouse Burger',
        quantity: 2,
        variationNameSnapshot: 'Duplo 200g',
        addonsSnapshot: [{ name: 'Bacon Rústico Defumado', price: 6.0 }],
        notes: 'Ponto da carne: rosada',
        unitPrice: 48.0,
        subtotal: 96.0,
      },
      {
        productNameSnapshot: 'Batata Frita Trufada',
        quantity: 1,
        variationNameSnapshot: 'Grande (500g)',
        addonsSnapshot: [{ name: 'Molho Parmesão e Trufas', price: 8.5 }],
        notes: '',
        unitPrice: 32.0,
        subtotal: 32.0,
      },
      {
        productNameSnapshot: 'Chopp Artesanal IPA',
        quantity: 1,
        variationNameSnapshot: 'Pint 500ml',
        addonsSnapshot: [],
        notes: 'Bem gelado',
        unitPrice: 14.5,
        subtotal: 14.5,
      },
    ],
  },
  {
    order: {
      id: 107,
      orderType: 'DINE_IN',
      status: 'DELIVERED',
      tableNumber: '03',
      customerName: null,
      deliveryAddress: null,
      totalAmount: 98.0,
      createdAt: daysAgo(3, 1),
      updatedAt: daysAgo(3, 0),
    },
    items: [
      {
        productNameSnapshot: 'Costela Barbecue Defumada',
        quantity: 1,
        variationNameSnapshot: 'Meia Costela 600g',
        addonsSnapshot: [{ name: 'Milho Doce Tostado', price: 7.0 }],
        notes: '',
        unitPrice: 76.0,
        subtotal: 76.0,
      },
      {
        productNameSnapshot: 'Chopp Artesanal IPA',
        quantity: 2,
        variationNameSnapshot: 'Caldereta 300ml',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 11.0,
        subtotal: 22.0,
      },
    ],
  },
  {
    order: {
      id: 108,
      orderType: 'DELIVERY',
      status: 'DELIVERED',
      tableNumber: null,
      customerName: 'Fernando Martins',
      deliveryAddress: 'Alameda Santos, 1400 - Ap 101',
      totalAmount: 215.0,
      createdAt: daysAgo(5, 6),
      updatedAt: daysAgo(5, 5),
    },
    items: [
      {
        productNameSnapshot: 'Picanha Steakhouse Burger',
        quantity: 3,
        variationNameSnapshot: 'Duplo 200g',
        addonsSnapshot: [{ name: 'Cheddar Inglês', price: 5.0 }],
        notes: '',
        unitPrice: 48.0,
        subtotal: 144.0,
      },
      {
        productNameSnapshot: 'Smash Crispy Bacon',
        quantity: 1,
        variationNameSnapshot: 'Triplo Smash',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 38.0,
        subtotal: 38.0,
      },
      {
        productNameSnapshot: 'Batata Frita Rústica',
        quantity: 2,
        variationNameSnapshot: 'Média (300g)',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 16.0,
        subtotal: 32.0,
      },
    ],
  },
  {
    order: {
      id: 109,
      orderType: 'DINE_IN',
      status: 'DELIVERED',
      tableNumber: '15',
      customerName: null,
      deliveryAddress: null,
      totalAmount: 180.0,
      createdAt: daysAgo(12, 2),
      updatedAt: daysAgo(12, 1),
    },
    items: [
      {
        productNameSnapshot: 'Costela Barbecue Defumada',
        quantity: 2,
        variationNameSnapshot: 'Meia Costela 600g',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 76.0,
        subtotal: 152.0,
      },
      {
        productNameSnapshot: 'Refrigerante Lata',
        quantity: 4,
        variationNameSnapshot: 'Guaraná Antarctica',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 7.0,
        subtotal: 28.0,
      },
    ],
  },
  {
    order: {
      id: 110,
      orderType: 'DELIVERY',
      status: 'DELIVERED',
      tableNumber: null,
      customerName: 'Camila Peixoto',
      deliveryAddress: 'Rua Augusta, 2100 - Apto 84',
      totalAmount: 260.0,
      createdAt: daysAgo(18, 5),
      updatedAt: daysAgo(18, 4),
    },
    items: [
      {
        productNameSnapshot: 'Picanha Steakhouse Burger',
        quantity: 4,
        variationNameSnapshot: 'Simples 180g',
        addonsSnapshot: [{ name: 'Bacon Rústico Defumado', price: 6.0 }],
        notes: '',
        unitPrice: 42.0,
        subtotal: 168.0,
      },
      {
        productNameSnapshot: 'Batata Frita Trufada',
        quantity: 2,
        variationNameSnapshot: 'Grande (500g)',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 32.0,
        subtotal: 64.0,
      },
      {
        productNameSnapshot: 'Suco Natural',
        quantity: 2,
        variationNameSnapshot: 'Laranja 500ml',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 14.0,
        subtotal: 28.0,
      },
    ],
  },
  {
    order: {
      id: 111,
      orderType: 'DELIVERY',
      status: 'CANCELLED',
      tableNumber: null,
      customerName: 'Rodrigo Nogueira',
      deliveryAddress: 'Av. Ibirapuera, 500',
      totalAmount: 65.0,
      createdAt: daysAgo(22, 2),
      updatedAt: daysAgo(22, 1),
    },
    items: [
      {
        productNameSnapshot: 'X-Salada Clássico',
        quantity: 1,
        variationNameSnapshot: 'Padrão 180g',
        addonsSnapshot: [],
        notes: 'Cliente desistiu do pedido',
        unitPrice: 35.0,
        subtotal: 35.0,
      },
      {
        productNameSnapshot: 'Batata Frita Rústica',
        quantity: 1,
        variationNameSnapshot: 'Média (300g)',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 16.0,
        subtotal: 16.0,
      },
      {
        productNameSnapshot: 'Chopp Artesanal IPA',
        quantity: 1,
        variationNameSnapshot: 'Pint 500ml',
        addonsSnapshot: [],
        notes: '',
        unitPrice: 14.0,
        subtotal: 14.0,
      },
    ],
  },
];

export function seedDatabase({ forceResetOrders = false } = {}) {
  // 1. Operador Padrão e Equipe Inicial (RN-010 / RNF-002)
  const existingAdmin = userRepo.findByUsername(env.ADMIN_DEFAULT_USER);
  if (!existingAdmin) {
    userRepo.create({
      name: 'Gabriel Souza (Gerente Geral)',
      username: env.ADMIN_DEFAULT_USER,
      passwordHash: hashPassword(env.ADMIN_DEFAULT_PASS),
      role: 'ADMIN',
      phone: '(11) 98765-4321',
      active: true,
    });
  } else if (!existingAdmin.name) {
    userRepo.update(existingAdmin.id, {
      name: 'Gabriel Souza (Gerente Geral)',
      phone: '(11) 98765-4321',
    });
  }

  const teamSamples = [
    {
      name: 'Juliana Rocha',
      username: 'juliana.atendente',
      password: 'atendente123',
      role: 'ATENDENTE',
      phone: '(11) 97123-4567',
    },
    {
      name: 'Chef Marcos Oliveira',
      username: 'marcos.cozinha',
      password: 'cozinha123',
      role: 'COZINHA',
      phone: '(11) 96234-5678',
    },
    {
      name: 'Lucas Mendes (Delivery)',
      username: 'lucas.motorista',
      password: 'motorista123',
      role: 'ENTREGADOR',
      phone: '(11) 95345-6789',
    },
  ];

  for (const member of teamSamples) {
    if (!userRepo.findByUsername(member.username)) {
      userRepo.create({
        name: member.name,
        username: member.username,
        passwordHash: hashPassword(member.password),
        role: member.role,
        phone: member.phone,
        active: true,
      });
    }
  }

  // 2. Categorias e Produtos Iniciais (RN-001 / RN-011)
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
      name: 'Sanduíche Sazonal Trufado (Inativo)',
      description:
        'Edição limitada indisponível no momento para demonstrar ocultação no cardápio público (RN-001).',
      basePrice: 44.0,
      imageUrl:
        'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
      active: false,
      variations: [],
      addons: [],
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
  }

  // 3. Pedidos Operacionais de Demonstração (#101 a #105)
  const sqlite = getSqlite();
  if (forceResetOrders) {
    sqlite.exec('DELETE FROM order_items; DELETE FROM orders;');
  }

  const existingOrders = orderRepo.findAll();
  if (existingOrders.length === 0) {
    for (const entry of INITIAL_SEED_ORDERS()) {
      orderRepo.createWithItems(entry.order, entry.items);
    }
  }
}

export function resetDemoOrders() {
  seedDatabase({ forceResetOrders: true });
  return orderRepo.findAll();
}
