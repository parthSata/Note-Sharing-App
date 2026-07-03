import { api } from '@/lib/api';

export type ShareState =
  | 'loading'
  | 'unlocked'
  | 'password-required'
  | 'wrong-password'
  | 'expired'
  | 'revoked'
  | 'used'
  | 'too-many-attempts'
  | 'invalid';

export interface ShareNoteData {
  title: string;
  content: string;
  viewCount: number;
  shareType?: string;
  expiresAt?: string;
}

export function useShare() {
  const resolveToken = async (
    rawToken: string,
  ): Promise<{ state: ShareState; data?: ShareNoteData }> => {
    try {
      const res = await api.get<{
        passwordRequired?: boolean;
        shareType?: string;
        expiresAt?: string;
        note?: { title: string; content: string };
        viewCount?: number;
      }>(`/share/${rawToken}`);

      if (res.passwordRequired) {
        return {
          state: 'password-required',
          data: {
            title: '',
            content: '',
            viewCount: 0,
            shareType: res.shareType,
            expiresAt: res.expiresAt,
          },
        };
      }

      return {
        state: 'unlocked',
        data: {
          title: res.note!.title,
          content: res.note!.content,
          viewCount: res.viewCount || 0,
        },
      };
    } catch (err: unknown) {
      const e = err as { code: string };
      const map: Record<string, ShareState> = {
        INVALID_TOKEN: 'invalid',
        EXPIRED_LINK: 'expired',
        ALREADY_USED: 'used',
        REVOKED_LINK: 'revoked',
      };
      return { state: map[e?.code] || 'invalid' };
    }
  };

  const unlockWithPassword = async (
    rawToken: string,
    password: string,
  ): Promise<{ state: ShareState; data?: ShareNoteData }> => {
    try {
      const res = await api.post<{
        note: { title: string; content: string };
        viewCount: number;
      }>(`/share/${rawToken}/unlock`, { password });

      return {
        state: 'unlocked',
        data: {
          title: res.note.title,
          content: res.note.content,
          viewCount: res.viewCount,
        },
      };
    } catch (err: unknown) {
      const e = err as { code: string };
      const map: Record<string, ShareState> = {
        WRONG_PASSWORD: 'wrong-password',
        TOO_MANY_ATTEMPTS: 'too-many-attempts',
        EXPIRED_LINK: 'expired',
        ALREADY_USED: 'used',
        REVOKED_LINK: 'revoked',
      };
      return { state: map[e?.code] || 'invalid' };
    }
  };

  return { resolveToken, unlockWithPassword };
}
