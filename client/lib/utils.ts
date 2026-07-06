import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const INDIA_TIME_ZONE = "Asia/Kolkata";
const TIME_ZONE_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const DATE_TIME_WITHOUT_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/;

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

export function formatDateTimeInIndia(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parseApiDate(value));
}

export function formatDateInIndia(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    dateStyle: "medium",
  }).format(parseApiDate(value));
}

export function parseApiDate(value: string | number | Date) {
  if (value instanceof Date || typeof value === "number") {
    return new Date(value);
  }

  const trimmedValue = value.trim();

  if (
    TIME_ZONE_OFFSET_PATTERN.test(trimmedValue) ||
    !DATE_TIME_WITHOUT_ZONE_PATTERN.test(trimmedValue)
  ) {
    return new Date(trimmedValue);
  }

  return new Date(`${trimmedValue.replace(" ", "T")}Z`);
}

export function getCurrentDateTimeLocalValueInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const lookup = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}`;
}

export function convertIndiaDateTimeLocalValueToIso(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    throw new Error("Invalid date-time value.");
  }

  const [, year, month, day, hour, minute, second = "0"] = match;
  const istOffsetMinutes = 330;
  const utcMillis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ) - istOffsetMinutes * 60 * 1000;

  return new Date(utcMillis).toISOString();
}

export function isIndiaDateTimeLocalValueInFuture(value: string) {
  return new Date(convertIndiaDateTimeLocalValueToIso(value)) > new Date();
}
