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

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:8080',
      'https://note-sharing-app-alpha.vercel.app/',
    ],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Share-View-Session'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

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
