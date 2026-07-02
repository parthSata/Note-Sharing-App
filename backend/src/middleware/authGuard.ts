import type { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import type { AppEnv } from '../env';
import { getAppEnv } from '../utils/env';
import { apiError, ERROR_CODES } from '../utils/errors';

type JwtPayload = {
  userId: string;
  email: string;
};

type AuthEnv = AppEnv & {
  Variables: JwtPayload;
};

export const authGuard: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const env = getAppEnv(c);
  const authorization = c.req.header('Authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    return apiError(c, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
  }

  const jwtSecret = env.JWT_SECRET;

  if (!jwtSecret) {
    return apiError(c, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
  }

  try {
    const payload = (await verify(token, jwtSecret, 'HS256')) as Partial<JwtPayload>;

    if (!payload.userId || !payload.email) {
      return apiError(c, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
    }

    c.set('userId', payload.userId);
    c.set('email', payload.email);

    return next();
  } catch {
    return apiError(c, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
  }
};
