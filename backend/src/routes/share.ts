import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { jsonError } from '../utils/errors';

export const shareRoutes = new Hono<AppEnv>();

shareRoutes.get('/:token', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Share routes are scaffolded only.', 501));
shareRoutes.post('/:token/unlock', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Share routes are scaffolded only.', 501));