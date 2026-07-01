import type { Context } from 'hono';

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_LINK: 'EXPIRED_LINK',
  ALREADY_USED: 'ALREADY_USED',
  REVOKED_LINK: 'REVOKED_LINK',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function apiError(
  c: Context,
  status: number,
  code: string,
  message: string,
) {
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    status as never,
  );
}

export function jsonError(
  c: Context,
  code: string,
  message: string,
  status = 400,
) {
  return apiError(c, status, code, message);
}
