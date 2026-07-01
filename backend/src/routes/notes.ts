import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { jsonError } from '../utils/errors';

export const notesRoutes = new Hono<AppEnv>();

notesRoutes.post('/', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Notes routes are scaffolded only.', 501));
notesRoutes.get('/:id', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Notes routes are scaffolded only.', 501));
notesRoutes.post('/:id/revoke', (c) => jsonError(c, 'NOT_IMPLEMENTED', 'Notes routes are scaffolded only.', 501));