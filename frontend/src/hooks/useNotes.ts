import { api } from "@/lib/api";

export type ShareType = "ONE_TIME" | "TIME_BASED";
export type AccessType = "PUBLIC" | "PASSWORD";

export type ShareLink = {
  id: string;
  noteId: string;
  shareType: ShareType;
  accessType: AccessType;
  expiresAt: string;
  revokedAt: string | null;
  consumedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  shareLinks?: ShareLink[];
};

export type CreateShareLinkOptions = {
  shareType: ShareType;
  accessType: AccessType;
  expiresAt: string;
  password?: string;
};

type ApiSuccess<T> = T & {
  success: true;
};

type NoteResponse = ApiSuccess<{
  note: Note;
}>;

type NotesResponse = ApiSuccess<{
  notes: Note[];
}>;

type CreateShareLinkResponse = ApiSuccess<{
  shareUrl: string;
  rawAccessKey: string | null;
}>;

type RevokeShareLinkResponse = ApiSuccess<{
  shareLink: ShareLink;
}>;

export function useNotes() {
  async function createNote(title: string, content: string) {
    const response = await api.post<NoteResponse>("/notes", {
      title,
      content,
    });

    return response.note;
  }

  async function getNote(id: string) {
    const response = await api.get<NoteResponse>(`/notes/${id}`);

    return response.note;
  }

  async function listNotes() {
    const response = await api.get<NotesResponse>("/notes");

    return response.notes;
  }

  async function createShareLink(noteId: string, options: CreateShareLinkOptions) {
    const response = await api.post<CreateShareLinkResponse>(`/notes/${noteId}/share`, options);

    return {
      shareUrl: response.shareUrl,
      rawAccessKey: response.rawAccessKey,
    };
  }

  async function revokeShareLink(noteId: string, shareId: string) {
    const response = await api.post<RevokeShareLinkResponse>(`/notes/${noteId}/revoke`, {
      shareId,
    });

    return response.shareLink;
  }

  return {
    createNote,
    getNote,
    listNotes,
    createShareLink,
    revokeShareLink,
  };
}
