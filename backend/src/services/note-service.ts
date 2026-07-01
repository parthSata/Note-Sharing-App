import { neon } from '@neondatabase/serverless';
import { ERROR_CODES } from '../utils/errors';

type ShareLinkRow = {
  id: string;
  noteId: string;
  shareType: 'ONE_TIME' | 'TIME_BASED';
  accessType: 'PUBLIC' | 'PASSWORD';
  expiresAt: Date | string;
  revokedAt: Date | string | null;
  consumedAt: Date | string | null;
  viewCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type NoteRow = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type NoteWithShareLinks = NoteRow & {
  shareLinks: ShareLinkRow[];
};

export class NoteServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'NoteServiceError';
  }
}

export async function createNote(
  databaseUrl: string | undefined,
  userId: string,
  title: string,
  content: string,
) {
  const db = getDatabase(databaseUrl);
  const now = new Date().toISOString();
  const notes = (await db`
    INSERT INTO "Note" (id, "userId", title, content, "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${userId}, ${title}, ${content}, ${now}, ${now})
    RETURNING id, "userId", title, content, "createdAt", "updatedAt"
  `) as NoteRow[];

  return notes[0];
}

export async function getNoteById(
  databaseUrl: string | undefined,
  noteId: string,
  userId: string,
) {
  const db = getDatabase(databaseUrl);
  const notes = (await db`
    SELECT id, "userId", title, content, "createdAt", "updatedAt"
    FROM "Note"
    WHERE id = ${noteId} AND "userId" = ${userId}
    LIMIT 1
  `) as NoteRow[];
  const note = notes[0];

  if (!note) {
    throw new NoteServiceError(
      404,
      ERROR_CODES.NOT_FOUND,
      'Note not found.',
    );
  }

  const shareLinks = await getShareLinksForNotes(databaseUrl, [note.id]);

  return {
    ...note,
    shareLinks: shareLinks.get(note.id) ?? [],
  };
}

export async function getUserNotes(
  databaseUrl: string | undefined,
  userId: string,
) {
  const db = getDatabase(databaseUrl);
  const notes = (await db`
    SELECT id, "userId", title, content, "createdAt", "updatedAt"
    FROM "Note"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
  `) as NoteRow[];
  const shareLinks = await getShareLinksForNotes(
    databaseUrl,
    notes.map((note) => note.id),
  );

  return notes.map<NoteWithShareLinks>((note) => ({
    ...note,
    shareLinks: shareLinks.get(note.id) ?? [],
  }));
}

async function getShareLinksForNotes(
  databaseUrl: string | undefined,
  noteIds: string[],
) {
  const linksByNoteId = new Map<string, ShareLinkRow[]>();

  if (noteIds.length === 0) {
    return linksByNoteId;
  }

  const db = getDatabase(databaseUrl);
  const shareLinks = (await db`
    SELECT
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
    FROM "ShareLink"
    WHERE "noteId" = ANY(${noteIds})
    ORDER BY "createdAt" DESC
  `) as ShareLinkRow[];

  for (const shareLink of shareLinks) {
    const existingLinks = linksByNoteId.get(shareLink.noteId) ?? [];
    existingLinks.push(shareLink);
    linksByNoteId.set(shareLink.noteId, existingLinks);
  }

  return linksByNoteId;
}

function getDatabase(databaseUrl?: string) {
  if (!databaseUrl) {
    throw new NoteServiceError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'DATABASE_URL is not configured.',
    );
  }

  return neon(databaseUrl);
}
