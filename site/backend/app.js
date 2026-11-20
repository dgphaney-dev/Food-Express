import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { errorHandler } from './admin/middlewares/errorHandler.js';
import { apiRouter } from './routes/apiRoutes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  // Servir frontend compilado em produção quando a pasta dist existir
  const distPath = path.resolve(process.cwd(), 'site/frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get(['/admin', '/admin/*'], (req, res) => {
      const adminHtml = path.join(distPath, 'admin.html');
      if (fs.existsSync(adminHtml)) {
        return res.sendFile(adminHtml);
      }
      return res.sendFile(path.join(distPath, 'index.html'));
    });

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      return res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Rota ${req.method} ${req.originalUrl} não encontrada.`,
      },
    });
  });

  app.use(errorHandler);
  return app;
}

export const app = createApp();
