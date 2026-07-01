import db from '../db/index';
import { ERROR_CODES } from '../utils/errors';

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
  userId: string,
  title: string,
  content: string,
) {
  return db.note.create({
    data: {
      userId,
      title,
      content,
    },
  });
}

export async function getNoteById(noteId: string, userId: string) {
  const note = await db.note.findFirst({
    where: {
      id: noteId,
      userId,
    },
    include: {
      shareLinks: true,
    },
  });

  if (!note) {
    throw new NoteServiceError(
      404,
      ERROR_CODES.NOT_FOUND,
      'Note not found.',
    );
  }

  return note;
}

export async function getUserNotes(userId: string) {
  return db.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
