import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './env';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes';
import { shareRoutes } from './routes/share';
import { apiError, ERROR_CODES } from './utils/errors';

const app = new Hono<AppEnv>();

const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: frontendOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

app.get('/health', (c) => {
  return c.json({
    ok: true,
    environment: process.env.APP_ENV ?? 'development',
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

const port = Number(process.env.PORT ?? 3001);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend server running on http://localhost:${port}`);

export default app;
