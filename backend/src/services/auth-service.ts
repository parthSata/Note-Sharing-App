import { sign } from 'jsonwebtoken';
import db from '../db/index';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { ERROR_CODES } from '../utils/errors';

const publicUserSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AuthServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export async function registerUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AuthServiceError(
      409,
      ERROR_CODES.VALIDATION_ERROR,
      'Email is already registered.',
    );
  }

  const passwordHash = await hashPassword(password);

  return db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
    select: publicUserSelect,
  });
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AuthServiceError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      'Invalid email or password.',
    );
  }

  const passwordIsValid = await verifyPassword(password, user.passwordHash);

  if (!passwordIsValid) {
    throw new AuthServiceError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      'Invalid email or password.',
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AuthServiceError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'JWT_SECRET is not configured.',
    );
  }

  const token = sign(
    {
      userId: user.id,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: '7d' },
  );

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return {
    token,
    user: publicUser,
  };
}

export async function getUserById(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
}
