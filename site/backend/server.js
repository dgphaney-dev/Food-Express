import { app } from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './db/connection.js';
import { seedDatabase } from './db/seed.js';

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception capturada:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection capturada:', reason);
});

initDatabase();
seedDatabase();

const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(env.PORT, HOST, () => {
  console.log(
    `🚀 FoodExpress Server rodando em http://${HOST}:${env.PORT}`
  );
  console.log(`📦 Banco SQLite inicializado em ${env.DATABASE_URL}`);
});

export default server;
