import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashCookie(cookie: string): string {
  // Simple hash function for cookie (not cryptographically secure, but sufficient for deduplication)
  let hash = 0;
  for (let i = 0; i < cookie.length; i++) {
    const char = cookie.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export function extractLinkedInUrls(text: string): string[] {
  const regex = /https:\/\/www\.linkedin\.com\/in\/[^"'\s]+/g;
  const matches = text.match(regex) || [];
  return [...new Set(matches)]; // Deduplicate
}

export function extractPhantomLogs(text: string): string[] {
  const regex = /\[info_][^\n]*|\[error][^\n]*/g;
  return text.match(regex) || [];
}

