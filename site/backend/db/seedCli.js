import { initDatabase } from './connection.js';
import { seedDatabase } from './seed.js';

initDatabase();
seedDatabase();
console.log('✅ Banco SQLite do FoodExpress inicializado para produção com sucesso!');
