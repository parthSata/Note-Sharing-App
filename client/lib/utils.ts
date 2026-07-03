import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeShareUrlForClient(shareUrl: string) {
  if (typeof window === "undefined" || !shareUrl) {
    return shareUrl;
  }

  try {
    const parsedUrl = new URL(shareUrl, window.location.origin);

    if (!parsedUrl.pathname.startsWith("/share/")) {
      return shareUrl;
    }

    return `${window.location.origin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return shareUrl;
  }
}
