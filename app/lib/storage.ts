import type { ScoutingEntry, PitEntry } from "./types";

export const STORAGE_KEY = "frc-scout-2026";
export const PIT_STORAGE_KEY = "frc-pit-2026";

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
  window.dispatchEvent(new Event("scout-updated"));
}

export function loadPitEntries(): PitEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PIT_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function savePitEntries(entries: PitEntry[]) {
  localStorage.setItem(PIT_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("scout-updated"));
}
