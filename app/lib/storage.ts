import type { ScoutingEntry } from "./types";

export const STORAGE_KEY = "frc-scout-2026";

export function loadEntries(): ScoutingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveEntries(entries: ScoutingEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  // Notify same-tab listeners (storage event only fires in other tabs)
  window.dispatchEvent(new Event("scout-updated"));
}
