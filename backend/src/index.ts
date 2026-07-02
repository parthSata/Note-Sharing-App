import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './env';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import { shareRoutes } from './routes/share';
import { getAppEnv } from './utils/env';
import { apiError, ERROR_CODES } from './utils/errors';

const app = new Hono<AppEnv>();

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173',
      'https://note-sharing-app-alpha.vercel.app',
    ],
    allowHeaders: [
      'Content-Type',
      'Authorization',
    ],
    allowMethods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    credentials: true,
    maxAge: 86400,
  }),
);

app.options('*', (c) => {
  return c.body(null, 204);
});

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
