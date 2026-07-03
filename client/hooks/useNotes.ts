import { api } from '@/lib/api';

export interface ShareLink {
  id: string;
  token?: string;
  shareUrl?: string;
  shareType: 'ONE_TIME' | 'TIME_BASED';
  accessType: 'PUBLIC' | 'PASSWORD';
  expiresAt: string;
  revokedAt: string | null;
  consumedAt: string | null;
  viewCount: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  shareLinks: ShareLink[];
}

interface CreateShareOptions {
  shareType: 'ONE_TIME' | 'TIME_BASED';
  accessType: 'PUBLIC' | 'PASSWORD';
  expiresAt: string;
  password?: string;
}

interface ShareLinkResponse {
  success: boolean;
  shareUrl: string;
  rawAccessKey: string | null;
  shareLink: ShareLink;
}

export function useNotes() {
  const createNote = async (title: string, content: string): Promise<Note> => {
    const data = await api.post<{ success: boolean; note: Note }>('/notes', {
      title,
      content,
    });
    return data.note;
  };

  const getNote = async (id: string): Promise<Note> => {
    const data = await api.get<{ success: boolean; note: Note }>(
      `/notes/${id}`,
    );
    return data.note;
  };

  const getUserNotes = async (): Promise<Note[]> => {
    const data = await api.get<{ success: boolean; notes: Note[] }>('/notes');
    return data.notes;
  };

  const createShareLink = async (
    noteId: string,
    options: CreateShareOptions,
  ): Promise<ShareLinkResponse> => {
    return await api.post<ShareLinkResponse>(`/notes/${noteId}/share`, options);
  };

  const revokeShareLink = async (
    noteId: string,
    shareId: string,
  ): Promise<void> => {
    await api.post(`/notes/${noteId}/revoke`, { shareId });
  };

  return {
    createNote,
    getNote,
    getUserNotes,
    createShareLink,
    revokeShareLink,
  };
}
