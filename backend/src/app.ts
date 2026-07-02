import { Hono } from 'hono';
import { logger } from 'hono/logger';
import type { AppEnv } from './env';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import { shareRoutes } from './routes/share';
import { getAppEnv } from './utils/env';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('*', logger());

  app.get('/', (c) => {
    return c.json({
      ok: true,
      name: 'Note Sharing API',
      health: '/health',
    });
  });

  app.get('/favicon.ico', (c) => {
    return c.body(null, 204);
  });

  app.get('/health', (c) => {
    const env = getAppEnv(c);

    return c.json({
      ok: true,
      environment: env.APP_ENV ?? 'development',
    });
  });

  app.route('/auth', authRoutes);
  app.route('/notes', notesRoutes);
  app.route('/share', shareRoutes);

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found.',
        },
      },
      404,
    );
  });

  return app;
}
