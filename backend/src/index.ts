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

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://note-sharing-app-alpha.vercel.app',
  'https://note-sharing-nc0b95k78-parthsatas-projects.vercel.app/',
  'https://note-sharing-app-nyde.vercel.app/',
];

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const normalizedOrigin = normalizeOrigin(origin);

      if (!normalizedOrigin) {
        return null;
      }

      const allowedOrigins = getAllowedOrigins(getAppEnv(c));

      return allowedOrigins.has(normalizedOrigin) || isLocalDevelopmentOrigin(normalizedOrigin)
        ? origin
        : null;
    },
    allowHeaders: ['Content-Type', 'Authorization', 'x-share-view-session'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);
app.options('*', (c) => c.body(null, 204));

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

function getAllowedOrigins(env: AppEnv['Bindings']) {
  return new Set(
    [
      ...defaultAllowedOrigins,
      env.FRONTEND_URL,
      env.APP_URL,
      ...(env.CORS_ORIGINS?.split(',') ?? []),
    ]
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin)),
  );
}

function normalizeOrigin(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return trimmedValue.replace(/\/+$/, '');
  }
}

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const { hostname, protocol } = new URL(origin);

    return protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1');
  } catch {
    return false;
  }
}
