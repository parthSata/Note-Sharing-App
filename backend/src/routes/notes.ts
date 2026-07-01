import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { authGuard } from '../middleware/authGuard';
import { apiError, ERROR_CODES } from '../utils/errors';

type NotesRouteEnv = AppEnv & {
  Variables: {
    userId: string;
    email: string;
  };
};

type JsonBody = Record<string, unknown>;

const SHARE_TYPES = ['ONE_TIME', 'TIME_BASED'] as const;
const ACCESS_TYPES = ['PUBLIC', 'PASSWORD'] as const;

export const notesRoutes = new Hono<NotesRouteEnv>();

notesRoutes.use('*', authGuard);

notesRoutes.get('/', async (c) => {
  try {
    const { getUserNotes } = await import('../services/note-service');
    const notes = await getUserNotes(c.env.DATABASE_URL, c.get('userId'));

    return c.json({ success: true, notes });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

notesRoutes.post('/', async (c) => {
  try {
    const body = await readJsonBody(c);
    const title = readRequiredString(body, 'title');
    const content = readRequiredString(body, 'content');
    const { createNote } = await import('../services/note-service');
    const note = await createNote(
      c.env.DATABASE_URL,
      c.get('userId'),
      title,
      content,
    );

    return c.json({ success: true, note }, 201);
  } catch (error) {
    return handleRouteError(c, error);
  }
});

notesRoutes.get('/:id', async (c) => {
  try {
    const { getNoteById } = await import('../services/note-service');
    const note = await getNoteById(
      c.env.DATABASE_URL,
      c.req.param('id'),
      c.get('userId'),
    );

    return c.json({ success: true, note });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

notesRoutes.post('/:id/share', async (c) => {
  try {
    const body = await readJsonBody(c);
    const shareType = readEnumValue(body, 'shareType', SHARE_TYPES);
    const accessType = readEnumValue(body, 'accessType', ACCESS_TYPES);
    const expiresAt = readFutureDate(body, 'expiresAt');
    const password =
      typeof body.password === 'string' && body.password.trim()
        ? body.password
        : undefined;
    const { createShareLink } = await import('../services/share-service');

    const share = await createShareLink(
      c.env.DATABASE_URL,
      c.env.FRONTEND_URL ?? c.env.APP_URL,
      c.req.param('id'),
      c.get('userId'),
      {
        shareType,
        accessType,
        expiresAt,
        password,
      },
    );

    return c.json(
      {
        success: true,
        shareUrl: share.shareUrl,
        rawAccessKey: share.rawAccessKey,
      },
      201,
    );
  } catch (error) {
    return handleRouteError(c, error);
  }
});

notesRoutes.post('/:id/revoke', async (c) => {
  try {
    const body = await readJsonBody(c);
    const shareId = readRequiredString(body, 'shareId');
    const { revokeShareLink } = await import('../services/share-service');

    const shareLink = await revokeShareLink(
      c.env.DATABASE_URL,
      shareId,
      c.get('userId'),
    );

    return c.json({ success: true, shareLink });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

async function readJsonBody(c: Parameters<typeof handleRouteError>[0]) {
  try {
    const body = await c.req.json();

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Body must be a JSON object.');
    }

    return body as JsonBody;
  } catch {
    throw new RouteValidationError('Request body must be valid JSON.');
  }
}

function readRequiredString(body: JsonBody, field: string) {
  const value = body[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw new RouteValidationError(`${field} is required.`);
  }

  return value.trim();
}

function readEnumValue<const T extends readonly string[]>(
  body: JsonBody,
  field: string,
  allowedValues: T,
) {
  const value = body[field];

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw new RouteValidationError(
      `${field} must be one of: ${allowedValues.join(', ')}.`,
    );
  }

  return value as T[number];
}

function readFutureDate(body: JsonBody, field: string) {
  const value = body[field];

  if (typeof value !== 'string') {
    throw new RouteValidationError(`${field} must be a date string.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new RouteValidationError(`${field} must be a future date.`);
  }

  return date;
}

class RouteValidationError extends Error {
  public readonly status = 400;
  public readonly code = ERROR_CODES.VALIDATION_ERROR;
}

function handleRouteError(
  c: Parameters<typeof apiError>[0],
  error: unknown,
) {
  if (
    error instanceof RouteValidationError ||
    isRouteServiceError(error)
  ) {
    return apiError(c, error.status, error.code, error.message);
  }

  return apiError(
    c,
    500,
    ERROR_CODES.INTERNAL_ERROR,
    'Something went wrong.',
  );
}

function isRouteServiceError(
  error: unknown,
): error is { status: number; code: string; message: string } {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number' &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
