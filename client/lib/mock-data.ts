export type ShareType = "ONE_TIME" | "TIME_BASED";
export type AccessType = "PUBLIC" | "PASSWORD";
export type ShareStatus = "active" | "expired" | "revoked";

export type MockNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  shareLink: {
    id: string;
    token: string;
    shareType: ShareType;
    accessType: AccessType;
    status: ShareStatus;
    viewCount: number;
    expiresAt: string;
    accessKey?: string;
  };
};

export type MockShareState =
  | "loading"
  | "unlocked-public"
  | "password-locked"
  | "wrong-password"
  | "expired"
  | "revoked"
  | "used"
  | "too-many-attempts"
  | "invalid";

export const mockUser = {
  id: "user_demo_001",
  email: "demo@example.com",
};

export const mockNotes: MockNote[] = [
  {
    id: "note_001",
    title: "Product launch checklist",
    content:
      "Finalize pricing, confirm launch email copy, verify analytics events, and prepare support notes before sharing the rollout plan.",
    createdAt: "2026-07-01T09:30:00.000Z",
    shareLink: {
      id: "share_001",
      token: "launch-plan-7xk29m",
      shareType: "TIME_BASED",
      accessType: "PUBLIC",
      status: "active",
      viewCount: 14,
      expiresAt: "2026-07-10T18:30:00.000Z",
    },
  },
  {
    id: "note_002",
    title: "Investor follow-up notes",
    content:
      "Summarize Q2 traction, attach revenue snapshots, and share the hiring roadmap with a password-protected link.",
    createdAt: "2026-06-28T14:15:00.000Z",
    shareLink: {
      id: "share_002",
      token: "investor-brief-4pqa8s",
      shareType: "ONE_TIME",
      accessType: "PASSWORD",
      status: "active",
      viewCount: 0,
      expiresAt: "2026-07-05T12:00:00.000Z",
      accessKey: "NS-4827-ALPHA",
    },
  },
  {
    id: "note_003",
    title: "Contract review summary",
    content:
      "Legal approved the revised termination clause. Finance still needs to confirm payment terms before final signature.",
    createdAt: "2026-06-20T11:45:00.000Z",
    shareLink: {
      id: "share_003",
      token: "contract-summary-9rvt2b",
      shareType: "TIME_BASED",
      accessType: "PASSWORD",
      status: "expired",
      viewCount: 5,
      expiresAt: "2026-06-30T23:59:00.000Z",
      accessKey: "NS-9012-OMEGA",
    },
  },
];

export const mockShareStates: MockShareState[] = [
  "loading",
  "unlocked-public",
  "password-locked",
  "wrong-password",
  "expired",
  "revoked",
  "used",
  "too-many-attempts",
  "invalid",
];
