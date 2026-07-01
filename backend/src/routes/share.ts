import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { apiError, ERROR_CODES } from '../utils/errors';

type JsonBody = Record<string, unknown>;

export const shareRoutes = new Hono<AppEnv>();

shareRoutes.get('/:token', async (c) => {
  try {
    const token = readRequiredParam(c.req.param('token'));
    const viewSessionId = readOptionalViewSessionId(
      c.req.header('X-Share-View-Session'),
    );
    const { resolveShareLink } = await import('../services/share-service');
    const result = await resolveShareLink(
      c.env.DATABASE_URL,
      token,
      viewSessionId,
    );

    return c.json({ success: true, ...result });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

shareRoutes.post('/:token/unlock', async (c) => {
  try {
    const token = readRequiredParam(c.req.param('token'));
    const viewSessionId = readOptionalViewSessionId(
      c.req.header('X-Share-View-Session'),
    );
    const body = await readJsonBody(c);
    const password = readRequiredString(body, 'password');
    const { unlockShareLink } = await import('../services/share-service');
    const result = await unlockShareLink(
      c.env.DATABASE_URL,
      token,
      password,
      viewSessionId,
    );

    return c.json({ success: true, ...result });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

function readRequiredParam(value: string) {
  if (!value.trim()) {
    throw new RouteValidationError('Share token is required.');
  }

  return value.trim();
}

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

function readOptionalViewSessionId(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.length > 128) {
    throw new RouteValidationError('View session id is too long.');
  }

  return trimmedValue;
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
