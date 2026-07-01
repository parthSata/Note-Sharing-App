import db from '../db/index';
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

type ShareLinkWithNote = Awaited<ReturnType<typeof findShareLinkByTokenHash>>;

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
  noteId: string,
  userId: string,
  options: CreateShareLinkOptions,
) {
  const note = await db.note.findFirst({
    where: {
      id: noteId,
      userId,
    },
    select: { id: true },
  });

  if (!note) {
    throw new ShareServiceError(
      403,
      ERROR_CODES.FORBIDDEN,
      'You do not have access to this note.',
    );
  }

  const rawToken = generateShareToken();
  const tokenHash = hashToken(rawToken);
  const rawAccessKey =
    options.accessType === 'PASSWORD' ? generateAccessKey() : null;
  const passwordHash = rawAccessKey ? await hashPassword(rawAccessKey) : null;

  await db.shareLink.create({
    data: {
      noteId,
      tokenHash,
      shareType: options.shareType,
      accessType: options.accessType,
      passwordHash,
      expiresAt: options.expiresAt,
    },
  });

  return {
    shareUrl: buildShareUrl(rawToken),
    rawToken,
    rawAccessKey,
  };
}

export async function resolveShareLink(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const shareLink = await findShareLinkByTokenHash(tokenHash);

  assertShareLinkIsValid(shareLink);

  if (shareLink.accessType === 'PASSWORD') {
    return {
      passwordRequired: true,
      shareType: shareLink.shareType,
      expiresAt: shareLink.expiresAt,
    };
  }

  await recordSuccessfulView(tokenHash, shareLink.shareType, {
    useTransaction: true,
  });

  return toUnlockedShareResponse(shareLink);
}

export async function unlockShareLink(
  rawToken: string,
  attemptedPassword: string,
) {
  const tokenHash = hashToken(rawToken);
  const shareLink = await findShareLinkByTokenHash(tokenHash);

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
    await db.shareLink.updateMany({
      where: { tokenHash },
      data: {
        failedAttempts: { increment: 1 },
        lastFailedAttemptAt: new Date(),
      },
    });

    throw new ShareServiceError(
      401,
      ERROR_CODES.WRONG_PASSWORD,
      'Wrong password.',
    );
  }

  await recordSuccessfulView(tokenHash, shareLink.shareType);

  return toUnlockedShareResponse(shareLink);
}

export async function revokeShareLink(shareId: string, userId: string) {
  const shareLink = await db.shareLink.findUnique({
    where: { id: shareId },
    include: {
      note: {
        select: { userId: true },
      },
    },
  });

  if (!shareLink || shareLink.note.userId !== userId) {
    throw new ShareServiceError(
      403,
      ERROR_CODES.FORBIDDEN,
      'You do not have access to this share link.',
    );
  }

  return db.shareLink.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  });
}

async function findShareLinkByTokenHash(tokenHash: string) {
  return db.shareLink.findUnique({
    where: { tokenHash },
    include: {
      note: {
        select: {
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

function assertShareLinkIsValid(
  shareLink: ShareLinkWithNote,
): asserts shareLink is NonNullable<ShareLinkWithNote> {
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

  if (shareLink.expiresAt < new Date()) {
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

function assertShareLinkIsNotRateLimited(shareLink: NonNullable<ShareLinkWithNote>) {
  if (!shareLink.lastFailedAttemptAt) {
    return;
  }

  const rateLimitStartedAt = Date.now() - RATE_LIMIT_WINDOW_MS;
  const lastFailedAttemptAt = shareLink.lastFailedAttemptAt.getTime();

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
  tokenHash: string,
  shareType: ShareTypeOption,
  options: { useTransaction?: boolean } = {},
) {
  const now = new Date();
  const updateArgs = {
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
      ...(shareType === 'ONE_TIME' ? { consumedAt: null } : {}),
    },
    data: {
      ...(shareType === 'ONE_TIME' ? { consumedAt: now } : {}),
      viewCount: { increment: 1 },
    },
  } as const;

  const updateResult = options.useTransaction
    ? await db.$transaction((tx) => tx.shareLink.updateMany(updateArgs))
    : await db.shareLink.updateMany(updateArgs);

  if (updateResult.count === 0) {
    const currentShareLink = await findShareLinkByTokenHash(tokenHash);
    assertShareLinkIsValid(currentShareLink);

    throw new ShareServiceError(
      409,
      ERROR_CODES.ALREADY_USED,
      'This one-time share link has already been used.',
    );
  }
}

function toUnlockedShareResponse(shareLink: NonNullable<ShareLinkWithNote>) {
  return {
    note: shareLink.note,
    shareType: shareLink.shareType,
    expiresAt: shareLink.expiresAt,
  };
}

function buildShareUrl(rawToken: string) {
  const baseUrl =
    process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

  return `${baseUrl.replace(/\/$/, '')}/share/${rawToken}`;
}
