import { customAlphabet, nanoid } from 'nanoid';

const ACCESS_KEY_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const createAccessKey = customAlphabet(ACCESS_KEY_ALPHABET, 12);
const PASSWORD_HASH_VERSION = 'pbkdf2-sha256';
const PASSWORD_HASH_ITERATIONS = 210000;
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_SALT_BYTES = 16;

export function generateShareToken(): string {
  return nanoid(32);
}

export async function hashToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw),
  );

  return bytesToHex(new Uint8Array(digest));
}

export async function verifyToken(raw: string, hash: string): Promise<boolean> {
  return constantTimeEqual(await hashToken(raw), hash);
}

export function generateAccessKey(): string {
  return createAccessKey();
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const derivedKey = await derivePasswordKey(plain, salt);

  return [
    PASSWORD_HASH_VERSION,
    PASSWORD_HASH_ITERATIONS,
    bytesToBase64(salt),
    bytesToBase64(derivedKey),
  ].join('$');
}

export async function verifyPassword(
  plain: string,
  storedHash: string,
): Promise<boolean> {
  const [version, iterations, salt, hash] = storedHash.split('$');

  if (version !== PASSWORD_HASH_VERSION || !iterations || !salt || !hash) {
    return false;
  }

  const derivedKey = await derivePasswordKey(
    plain,
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

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
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
