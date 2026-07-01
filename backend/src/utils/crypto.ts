import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { customAlphabet, nanoid } from 'nanoid';

const ACCESS_KEY_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const createAccessKey = customAlphabet(ACCESS_KEY_ALPHABET, 12);

export function generateShareToken(): string {
  return nanoid(32);
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function verifyToken(raw: string, hash: string): boolean {
  return hashToken(raw) === hash;
}

export function generateAccessKey(): string {
  return createAccessKey();
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
