import { ApiError, api } from "@/lib/api";
import type { ShareType } from "@/hooks/useNotes";

type SharedNote = {
  title: string;
  content: string;
};

type PasswordRequiredResponse = {
  passwordRequired: true;
  shareType: ShareType;
  expiresAt: string;
};

type UnlockedShareResponse = {
  success: true;
  note: SharedNote;
  viewCount: number;
};

type ResolveTokenState = {
  state: "invalid" | "expired" | "used" | "revoked";
  message: string;
};

type UnlockPasswordState = {
  state: "wrong-password" | "too-many-attempts" | "expired" | "used" | "revoked";
  message: string;
};

type ResolveTokenResponse = PasswordRequiredResponse | UnlockedShareResponse | ResolveTokenState;

type UnlockPasswordResponse = UnlockedShareResponse | UnlockPasswordState;

const resolveErrorStates = {
  INVALID_TOKEN: "invalid",
  EXPIRED_LINK: "expired",
  ALREADY_USED: "used",
  REVOKED_LINK: "revoked",
} as const;

const unlockErrorStates = {
  WRONG_PASSWORD: "wrong-password",
  TOO_MANY_ATTEMPTS: "too-many-attempts",
  EXPIRED_LINK: "expired",
  ALREADY_USED: "used",
  REVOKED_LINK: "revoked",
} as const;

const SHARE_VIEW_SESSION_PREFIX = "share_view_session:";

export function useShare() {
  async function resolveToken(rawToken: string): Promise<ResolveTokenResponse> {
    try {
      return await api.get<PasswordRequiredResponse | UnlockedShareResponse>(
        `/share/${rawToken}`,
        getShareViewSessionOptions(rawToken),
      );
    } catch (error) {
      if (error instanceof ApiError && error.code in resolveErrorStates) {
        return {
          state: resolveErrorStates[error.code as keyof typeof resolveErrorStates],
          message: error.message,
        };
      }

      throw error;
    }
  }

  async function unlockWithPassword(
    rawToken: string,
    password: string,
  ): Promise<UnlockPasswordResponse> {
    try {
      return await api.post<UnlockedShareResponse>(
        `/share/${rawToken}/unlock`,
        {
          password,
        },
        getShareViewSessionOptions(rawToken),
      );
    } catch (error) {
      if (error instanceof ApiError && error.code in unlockErrorStates) {
        return {
          state: unlockErrorStates[error.code as keyof typeof unlockErrorStates],
          message: error.message,
        };
      }

      throw error;
    }
  }

  return {
    resolveToken,
    unlockWithPassword,
  };
}

function getShareViewSessionOptions(rawToken: string): RequestInit | undefined {
  const sessionId = getShareViewSessionId(rawToken);

  if (!sessionId) {
    return undefined;
  }

  return {
    headers: {
      "X-Share-View-Session": sessionId,
    },
  };
}

function getShareViewSessionId(rawToken: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const key = `${SHARE_VIEW_SESSION_PREFIX}${rawToken}`;
  const existingSessionId = window.localStorage.getItem(key);

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = createSessionId();
  window.localStorage.setItem(key, sessionId);

  return sessionId;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
