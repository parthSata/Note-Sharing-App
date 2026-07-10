import { neon } from '@neondatabase/serverless';
import { sign, verify } from 'hono/jwt';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { getAppEnv } from '../utils/env';
import { apiError, ERROR_CODES } from '../utils/errors';

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type PublicUser = Omit<UserRow, 'passwordHash'>;

type AuthPayload = {
  userId?: string;
  email?: string;
};

const PASSWORD_HASH_VERSION = 'pbkdf2-sha256';
const PASSWORD_HASH_ITERATIONS = 210000;
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_SALT_BYTES = 16;

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/register', async (c) => {
  try {
    const env = getAppEnv(c);
    const { email, password } = await readCredentials(c);
    const db = getDatabase(env.DATABASE_URL);
    const normalizedEmail = email.trim().toLowerCase();
    const existingUsers = (await db`
      SELECT id, email, "passwordHash", "createdAt", "updatedAt"
      FROM "User"
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `) as UserRow[];

    if (existingUsers.length > 0) {
      return apiError(
        c,
        409,
        ERROR_CODES.VALIDATION_ERROR,
        'Email is already registered.',
      );
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);
    const createdUsers = (await db`
      INSERT INTO "User" (id, email, "passwordHash", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${normalizedEmail}, ${passwordHash}, ${now}, ${now})
      RETURNING id, email, "passwordHash", "createdAt", "updatedAt"
    `) as UserRow[];
    const user = toPublicUser(createdUsers[0]);
    const token = await createToken(env.JWT_SECRET, user);

    return c.json({ token, user }, 201);
  } catch (error) {
    return handleAuthError(c, error);
  }
});

authRoutes.post('/login', async (c) => {
  try {
    const env = getAppEnv(c);
    const { email, password } = await readCredentials(c);
    const db = getDatabase(env.DATABASE_URL);
    const normalizedEmail = email.trim().toLowerCase();
    const users = (await db`
      SELECT id, email, "passwordHash", "createdAt", "updatedAt"
      FROM "User"
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `) as UserRow[];
    const user = users[0];

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return apiError(
        c,
        401,
        ERROR_CODES.UNAUTHORIZED,
        'Invalid email or password.',
      );
    }

    const publicUser = toPublicUser(user);
    const token = await createToken(env.JWT_SECRET, publicUser);

    return c.json({ token, user: publicUser });
  } catch (error) {
    return handleAuthError(c, error);
  }
});

authRoutes.get('/me', async (c) => {
  try {
    const env = getAppEnv(c);
    const payload = await readAuthPayload(c.req.header('Authorization'), env.JWT_SECRET);
    const db = getDatabase(env.DATABASE_URL);
    const users = (await db`
      SELECT id, email, "passwordHash", "createdAt", "updatedAt"
      FROM "User"
      WHERE id = ${payload.userId}
      LIMIT 1
    `) as UserRow[];

    if (!users[0]) {
      return apiError(c, 401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
    }

    return c.json({ user: toPublicUser(users[0]) });
  } catch (error) {
    return handleAuthError(c, error);
  }
});

authRoutes.post('/logout', (c) => c.json({ success: true }));

async function readCredentials(c: Parameters<typeof handleAuthError>[0]) {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    throw new AuthRouteError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Request body must be valid JSON.',
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AuthRouteError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Request body must be a JSON object.',
    );
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !email.includes('@')) {
    throw new AuthRouteError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Enter a valid email address.',
    );
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new AuthRouteError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Password must be at least 8 characters.',
    );
  }

  if (/\s/.test(password)) {
    throw new AuthRouteError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Password cannot contain spaces.',
    );
  }

  return { email, password };
}

function getDatabase(databaseUrl?: string) {
  if (!databaseUrl) {
    throw new AuthRouteError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'DATABASE_URL is not configured.',
    );
  }

  return neon(databaseUrl);
}

async function createToken(jwtSecret: string | undefined, user: PublicUser) {
  if (!jwtSecret) {
    throw new AuthRouteError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'JWT_SECRET is not configured.',
    );
  }

  return sign(
    {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    jwtSecret,
    'HS256',
  );
}

async function readAuthPayload(
  authorization: string | undefined,
  jwtSecret: string | undefined,
) {
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;

  if (!token || !jwtSecret) {
    throw new AuthRouteError(401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
  }

  const payload = (await verify(token, jwtSecret, 'HS256')) as AuthPayload;

  if (!payload.userId || !payload.email) {
    throw new AuthRouteError(401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized.');
  }

  return payload;
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const derivedKey = await derivePasswordKey(password, salt);

  return [
    PASSWORD_HASH_VERSION,
    PASSWORD_HASH_ITERATIONS,
    bytesToBase64(salt),
    bytesToBase64(derivedKey),
  ].join('$');
}

async function verifyPassword(password: string, storedHash: string) {
  const [version, iterations, salt, hash] = storedHash.split('$');

  if (version !== PASSWORD_HASH_VERSION || !iterations || !salt || !hash) {
    return false;
  }

  const derivedKey = await derivePasswordKey(
    password,
    base64ToBytes(salt),
    Number(iterations),
  );

  return constantTimeEqual(bytesToBase64(derivedKey), hash);
}

async function derivePasswordKey(
  password: string,
  salt: Uint8Array,
  iterations = PASSWORD_HASH_ITERATIONS,
) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations,
    },
    keyMaterial,
    PASSWORD_HASH_BYTES * 8,
  );

  return new Uint8Array(bits);
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

function toPublicUser(user: UserRow | undefined): PublicUser {
  if (!user) {
    throw new AuthRouteError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'Unable to create user.',
    );
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return publicUser;
}

class AuthRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthRouteError';
  }
}

function handleAuthError(
  c: Parameters<typeof apiError>[0],
  error: unknown,
) {
  if (error instanceof AuthRouteError) {
    return apiError(c, error.status, error.code, error.message);
  }

  return apiError(
    c,
    500,
    ERROR_CODES.INTERNAL_ERROR,
    'Something went wrong.',
  );
}
