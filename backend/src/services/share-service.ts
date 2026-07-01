import { neon } from '@neondatabase/serverless';
import {
  generateAccessKey,
  generateShareToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../utils/crypto';
import { ERROR_CODES } from '../utils/errors';

type ShareTypeOption = 'ONE_TIME' | 'TIME_BASED';
type AccessTypeOption = 'PUBLIC' | 'PASSWORD';

type CreateShareLinkOptions = {
  shareType: ShareTypeOption;
  accessType: AccessTypeOption;
  expiresAt: Date;
  password?: string;
};

type ShareLinkRow = {
  id: string;
  noteId: string;
  tokenHash: string;
  shareType: ShareTypeOption;
  accessType: AccessTypeOption;
  passwordHash: string | null;
  expiresAt: Date | string;
  revokedAt: Date | string | null;
  consumedAt: Date | string | null;
  viewCount: number;
  failedAttempts: number;
  lastFailedAttemptAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  noteTitle: string;
  noteContent: string;
  noteCreatedAt: Date | string;
  noteUpdatedAt: Date | string;
};

type SafeShareLinkRow = Omit<
  ShareLinkRow,
  | 'tokenHash'
  | 'passwordHash'
  | 'failedAttempts'
  | 'lastFailedAttemptAt'
  | 'noteTitle'
  | 'noteContent'
  | 'noteCreatedAt'
  | 'noteUpdatedAt'
>;

const TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

export class ShareServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ShareServiceError';
  }
}

export async function createShareLink(
  databaseUrl: string | undefined,
  frontendUrl: string | undefined,
  noteId: string,
  userId: string,
  options: CreateShareLinkOptions,
) {
  const db = getDatabase(databaseUrl);
  const notes = (await db`
    SELECT id
    FROM "Note"
    WHERE id = ${noteId} AND "userId" = ${userId}
    LIMIT 1
  `) as { id: string }[];

  if (!notes[0]) {
    throw new ShareServiceError(
      403,
      ERROR_CODES.FORBIDDEN,
      'You do not have access to this note.',
    );
  }

  const rawToken = generateShareToken();
  const tokenHash = await hashToken(rawToken);
  const rawAccessKey =
    options.accessType === 'PASSWORD' ? generateAccessKey() : null;
  const passwordHash = rawAccessKey ? await hashPassword(rawAccessKey) : null;
  const now = new Date().toISOString();

  await db`
    INSERT INTO "ShareLink" (
      id,
      "noteId",
      "tokenHash",
      "shareType",
      "accessType",
      "passwordHash",
      "expiresAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${noteId},
      ${tokenHash},
      ${options.shareType},
      ${options.accessType},
      ${passwordHash},
      ${options.expiresAt.toISOString()},
      ${now},
      ${now}
    )
  `;

  return {
    shareUrl: buildShareUrl(frontendUrl, rawToken),
    rawToken,
    rawAccessKey,
  };
}

export async function resolveShareLink(
  databaseUrl: string | undefined,
  rawToken: string,
  viewSessionId?: string,
) {
  const tokenHash = await hashToken(rawToken);
  const shareLink = await findShareLinkByTokenHash(databaseUrl, tokenHash);

  assertShareLinkIsValid(shareLink);

  if (shareLink.accessType === 'PASSWORD') {
    return {
      passwordRequired: true,
      shareType: shareLink.shareType,
      expiresAt: shareLink.expiresAt,
    };
  }

  const viewCount = await recordSuccessfulView(
    databaseUrl,
    shareLink.id,
    tokenHash,
    shareLink.shareType,
    viewSessionId,
  );

  return toUnlockedShareResponse(shareLink, viewCount);
}

export async function unlockShareLink(
  databaseUrl: string | undefined,
  rawToken: string,
  attemptedPassword: string,
  viewSessionId?: string,
) {
  const tokenHash = await hashToken(rawToken);
  const shareLink = await findShareLinkByTokenHash(databaseUrl, tokenHash);

  assertShareLinkIsValid(shareLink);

  if (shareLink.accessType !== 'PASSWORD' || !shareLink.passwordHash) {
    throw new ShareServiceError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'This share link does not require a password.',
    );
  }

  assertShareLinkIsNotRateLimited(shareLink);

  const passwordIsValid = await verifyPassword(
    attemptedPassword,
    shareLink.passwordHash,
  );

  if (!passwordIsValid) {
    const db = getDatabase(databaseUrl);

    await db`
      UPDATE "ShareLink"
      SET "failedAttempts" = "failedAttempts" + 1,
          "lastFailedAttemptAt" = ${new Date().toISOString()},
          "updatedAt" = ${new Date().toISOString()}
      WHERE "tokenHash" = ${tokenHash}
    `;

    throw new ShareServiceError(
      400,
      ERROR_CODES.WRONG_PASSWORD,
      'Wrong password.',
    );
  }

  const viewCount = await recordSuccessfulView(
    databaseUrl,
    shareLink.id,
    tokenHash,
    shareLink.shareType,
    viewSessionId,
  );

  return toUnlockedShareResponse(shareLink, viewCount);
}

export async function revokeShareLink(
  databaseUrl: string | undefined,
  shareId: string,
  userId: string,
) {
  const db = getDatabase(databaseUrl);
  const now = new Date().toISOString();
  const shareLinks = (await db`
    UPDATE "ShareLink"
    SET "revokedAt" = ${now}, "updatedAt" = ${now}
    WHERE id = ${shareId}
      AND EXISTS (
        SELECT 1
        FROM "Note"
        WHERE "Note".id = "ShareLink"."noteId"
          AND "Note"."userId" = ${userId}
      )
    RETURNING
      id,
      "noteId",
      "shareType",
      "accessType",
      "expiresAt",
      "revokedAt",
      "consumedAt",
      "viewCount",
      "createdAt",
      "updatedAt"
  `) as SafeShareLinkRow[];
  const shareLink = shareLinks[0];

  if (!shareLink) {
    throw new ShareServiceError(
      403,
      ERROR_CODES.FORBIDDEN,
      'You do not have access to this share link.',
    );
  }

  return shareLink;
}

async function findShareLinkByTokenHash(
  databaseUrl: string | undefined,
  tokenHash: string,
) {
  const db = getDatabase(databaseUrl);
  const shareLinks = (await db`
    SELECT
      "ShareLink".id,
      "ShareLink"."noteId",
      "ShareLink"."tokenHash",
      "ShareLink"."shareType",
      "ShareLink"."accessType",
      "ShareLink"."passwordHash",
      "ShareLink"."expiresAt",
      "ShareLink"."revokedAt",
      "ShareLink"."consumedAt",
      "ShareLink"."viewCount",
      "ShareLink"."failedAttempts",
      "ShareLink"."lastFailedAttemptAt",
      "ShareLink"."createdAt",
      "ShareLink"."updatedAt",
      "Note".title AS "noteTitle",
      "Note".content AS "noteContent",
      "Note"."createdAt" AS "noteCreatedAt",
      "Note"."updatedAt" AS "noteUpdatedAt"
    FROM "ShareLink"
    INNER JOIN "Note" ON "Note".id = "ShareLink"."noteId"
    WHERE "ShareLink"."tokenHash" = ${tokenHash}
    LIMIT 1
  `) as ShareLinkRow[];

  return shareLinks[0] ?? null;
}

function assertShareLinkIsValid(
  shareLink: ShareLinkRow | null,
): asserts shareLink is ShareLinkRow {
  if (!shareLink) {
    throw new ShareServiceError(
      404,
      ERROR_CODES.INVALID_TOKEN,
      'Invalid share link.',
    );
  }

  if (shareLink.revokedAt) {
    throw new ShareServiceError(
      410,
      ERROR_CODES.REVOKED_LINK,
      'This share link has been revoked.',
    );
  }

  if (new Date(shareLink.expiresAt) < new Date()) {
    throw new ShareServiceError(
      410,
      ERROR_CODES.EXPIRED_LINK,
      'This share link has expired.',
    );
  }

  if (shareLink.shareType === 'ONE_TIME' && shareLink.consumedAt) {
    throw new ShareServiceError(
      410,
      ERROR_CODES.ALREADY_USED,
      'This one-time share link has already been used.',
    );
  }
}

function assertShareLinkIsNotRateLimited(shareLink: ShareLinkRow) {
  if (!shareLink.lastFailedAttemptAt) {
    return;
  }

  const rateLimitStartedAt = Date.now() - RATE_LIMIT_WINDOW_MS;
  const lastFailedAttemptAt = new Date(
    shareLink.lastFailedAttemptAt,
  ).getTime();

  if (
    shareLink.failedAttempts >= MAX_FAILED_ATTEMPTS &&
    lastFailedAttemptAt >= rateLimitStartedAt
  ) {
    throw new ShareServiceError(
      429,
      TOO_MANY_ATTEMPTS,
      'Too many failed attempts. Try again later.',
    );
  }
}

async function recordSuccessfulView(
  databaseUrl: string | undefined,
  shareLinkId: string,
  tokenHash: string,
  shareType: ShareTypeOption,
  viewSessionId?: string,
) {
  const db = getDatabase(databaseUrl);
  const now = new Date().toISOString();

  if (shareType === 'TIME_BASED' && viewSessionId) {
    const isNewViewSession = await recordViewSession(
      databaseUrl,
      shareLinkId,
      viewSessionId,
    );

    if (!isNewViewSession) {
      const currentRows = (await db`
        SELECT "viewCount"
        FROM "ShareLink"
        WHERE "tokenHash" = ${tokenHash}
        LIMIT 1
      `) as { viewCount: number }[];

      return currentRows[0]?.viewCount ?? 0;
    }
  }

  const updatedRows =
    shareType === 'ONE_TIME'
      ? ((await db`
          UPDATE "ShareLink"
          SET "consumedAt" = ${now},
              "viewCount" = "viewCount" + 1,
              "updatedAt" = ${now}
          WHERE "tokenHash" = ${tokenHash}
            AND "revokedAt" IS NULL
            AND "expiresAt" > ${now}
            AND "consumedAt" IS NULL
          RETURNING "viewCount"
        `) as { viewCount: number }[])
      : ((await db`
          UPDATE "ShareLink"
          SET "viewCount" = "viewCount" + 1,
              "updatedAt" = ${now}
          WHERE "tokenHash" = ${tokenHash}
            AND "revokedAt" IS NULL
            AND "expiresAt" > ${now}
          RETURNING "viewCount"
        `) as { viewCount: number }[]);

  if (updatedRows[0]) {
    return updatedRows[0].viewCount;
  }

  const currentShareLink = await findShareLinkByTokenHash(
    databaseUrl,
    tokenHash,
  );
  assertShareLinkIsValid(currentShareLink);

  throw new ShareServiceError(
    409,
    ERROR_CODES.ALREADY_USED,
    'This one-time share link has already been used.',
  );
}

async function recordViewSession(
  databaseUrl: string | undefined,
  shareLinkId: string,
  viewSessionId: string,
) {
  await ensureShareViewSessionTable(databaseUrl);

  const db = getDatabase(databaseUrl);
  const sessionHash = await hashToken(viewSessionId);
  const rows = (await db`
    INSERT INTO "ShareViewSession" (
      id,
      "shareLinkId",
      "sessionHash",
      "createdAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${shareLinkId},
      ${sessionHash},
      ${new Date().toISOString()}
    )
    ON CONFLICT ("shareLinkId", "sessionHash") DO NOTHING
    RETURNING id
  `) as { id: string }[];

  return Boolean(rows[0]);
}

async function ensureShareViewSessionTable(databaseUrl: string | undefined) {
  const db = getDatabase(databaseUrl);

  await db`
    CREATE TABLE IF NOT EXISTS "ShareViewSession" (
      id TEXT PRIMARY KEY,
      "shareLinkId" TEXT NOT NULL REFERENCES "ShareLink"(id) ON DELETE CASCADE,
      "sessionHash" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`
    CREATE UNIQUE INDEX IF NOT EXISTS "ShareViewSession_shareLinkId_sessionHash_key"
    ON "ShareViewSession" ("shareLinkId", "sessionHash")
  `;
}

function toUnlockedShareResponse(shareLink: ShareLinkRow, viewCount: number) {
  return {
    note: {
      title: shareLink.noteTitle,
      content: shareLink.noteContent,
      createdAt: shareLink.noteCreatedAt,
      updatedAt: shareLink.noteUpdatedAt,
    },
    shareType: shareLink.shareType,
    expiresAt: shareLink.expiresAt,
    viewCount,
  };
}

function buildShareUrl(frontendUrl: string | undefined, rawToken: string) {
  const baseUrl = frontendUrl ?? 'http://localhost:3000';

  return `${baseUrl.replace(/\/$/, '')}/share/${rawToken}`;
}

function getDatabase(databaseUrl?: string) {
  if (!databaseUrl) {
    throw new ShareServiceError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'DATABASE_URL is not configured.',
    );
  }

  return neon(databaseUrl);
}
