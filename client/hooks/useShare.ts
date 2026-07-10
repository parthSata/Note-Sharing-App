import { api } from '@/lib/api';
import { useCallback } from 'react';

const SHARE_VIEW_SESSION_KEY = 'note_share_view_session';

function getShareViewSessionId() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const existingSessionId = localStorage.getItem(SHARE_VIEW_SESSION_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(SHARE_VIEW_SESSION_KEY, sessionId);

  return sessionId;
}

function getShareViewHeaders() {
  const sessionId = getShareViewSessionId();

  return sessionId ? { 'X-Share-View-Session': sessionId } : undefined;
}

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

type ShareResult = { state: ShareState; data?: ShareNoteData };

const resolveTokenRequests = new Map<string, Promise<ShareResult>>();

export function useShare() {
  const resolveToken = useCallback(async (
    rawToken: string,
  ): Promise<ShareResult> => {
    const cachedRequest = resolveTokenRequests.get(rawToken);

    if (cachedRequest) {
      return cachedRequest;
    }

    const request = resolveTokenFromApi(rawToken);
    resolveTokenRequests.set(rawToken, request);

    return request;
  }, []);

  const unlockWithPassword = useCallback(async (
    rawToken: string,
    password: string,
  ): Promise<ShareResult> => {
    try {
      const res = await api.post<{
        note: { title: string; content: string };
        viewCount: number;
      }>(
        `/share/${rawToken}/unlock`,
        { password },
        { headers: getShareViewHeaders() },
      );

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
  }, []);

  return { resolveToken, unlockWithPassword };
}

async function resolveTokenFromApi(rawToken: string): Promise<ShareResult> {
  try {
    const res = await api.get<{
      passwordRequired?: boolean;
      shareType?: string;
      expiresAt?: string;
      note?: { title: string; content: string };
      viewCount?: number;
    }>(`/share/${rawToken}`, {
      headers: getShareViewHeaders(),
    });

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
}
