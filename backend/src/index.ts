import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './env';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import { shareRoutes } from './routes/share';
import { apiError, ERROR_CODES } from './utils/errors';

const app = new Hono<AppEnv>();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return origin;
      }

      return c.env.FRONTEND_URL ?? c.env.APP_URL ?? 'http://localhost:3000';
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Share-View-Session'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

app.get('/health', (c) => {
  return c.json({
    ok: true,
    environment: c.env.APP_ENV ?? 'development',
  });
});

app.route('/auth', authRoutes);
app.route('/notes', notesRoutes);
app.route('/share', shareRoutes);

app.onError((error, c) => {
  console.error(error);

  return apiError(
    c,
    500,
    ERROR_CODES.INTERNAL_ERROR,
    'Something went wrong.',
  );
});

app.notFound((c) => {
  return apiError(c, 404, ERROR_CODES.NOT_FOUND, 'Route not found.');
});

export default app;
