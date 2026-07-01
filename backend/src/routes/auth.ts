import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { jsonError } from '../utils/errors';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/register', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Auth routes are scaffolded only.', 501));
authRoutes.post('/login', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Auth routes are scaffolded only.', 501));
authRoutes.get('/me', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Auth routes are scaffolded only.', 501));
authRoutes.post('/logout', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Auth routes are scaffolded only.', 501));