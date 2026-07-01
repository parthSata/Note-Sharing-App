// Tiny client-side mock auth (no backend wiring)
const KEY = "noteshare.user";

export type MockUser = { email: string } | null;

export function getUser(): MockUser {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function setUser(u: MockUser) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("noteshare:auth"));
}
