import type { ConferenceEntry, PitEntry } from "./types";
import { supabase } from "./supabase";

export const CONFERENCE_STORAGE_KEY = "frc-conference-2026";
export const PIT_STORAGE_KEY = "frc-pit-2026";

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}

// ── Local storage ─────────────────────────────────────────────────────────────

export function loadConferenceEntries(): ConferenceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CONFERENCE_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveConferenceEntries(entries: ConferenceEntry[]) {
  localStorage.setItem(CONFERENCE_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("scout-updated"));
  syncConferenceEntriesToSupabase(entries).catch(() => {});
}

export function loadPitEntries(): PitEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const entries = JSON.parse(localStorage.getItem(PIT_STORAGE_KEY) ?? "[]") as Array<Record<string, unknown>>;
    return entries.map((entry) => ({
      ...entry,
      photoUrls: stringArray(entry.photoUrls),
    })) as PitEntry[];
  } catch {
    return [];
  }
}

export function savePitEntries(entries: PitEntry[]) {
  localStorage.setItem(PIT_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("scout-updated"));
  syncPitEntriesToSupabase(entries).catch(() => {});
}

// ── Field mapping ─────────────────────────────────────────────────────────────

function conferenceEntryToRow(e: ConferenceEntry) {
  return {
    id:              e.id,
    timestamp:       e.timestamp,
    first_name:      e.firstName,
    last_name:       e.lastName,
    division:        e.division,
    team_number:     e.teamNumber,
    team_name:       e.teamName,
    conference_name: e.conferenceName,
    learned:         e.learned,
  };
}

function rowToConferenceEntry(row: Record<string, unknown>): ConferenceEntry {
  return {
    id:             row.id as string,
    timestamp:      row.timestamp as number,
    firstName:      (row.first_name as string) ?? "",
    lastName:       (row.last_name as string) ?? "",
    division:       (row.division as string) ?? "",
    teamNumber:     (row.team_number as string) ?? "",
    teamName:       (row.team_name as string) ?? "",
    conferenceName: (row.conference_name as string) ?? "",
    learned:        (row.learned as string) ?? "",
  };
}

function pitEntryToRow(e: PitEntry) {
  return {
    id:          e.id,
    timestamp:   e.timestamp,
    first_name:  e.firstName,
    last_name:   e.lastName,
    division:    e.division,
    team_number: e.teamNumber,
    team_name:   e.teamName,
    photo_urls:  stringArray(e.photoUrls),
    instagram:   e.instagram,
    learned:     e.learned,
  };
}

function rowToPitEntry(row: Record<string, unknown>): PitEntry {
  return {
    id:         row.id as string,
    timestamp:  row.timestamp as number,
    firstName:  (row.first_name as string) ?? "",
    lastName:   (row.last_name as string) ?? "",
    division:   (row.division as string) ?? "",
    teamNumber: (row.team_number as string) ?? "",
    teamName:   (row.team_name as string) ?? "",
    photoUrls:  stringArray(row.photo_urls),
    instagram:  (row.instagram as string) ?? "",
    learned:    (row.learned as string) ?? "",
  };
}

// ── Background sync ───────────────────────────────────────────────────────────

async function syncConferenceEntriesToSupabase(entries: ConferenceEntry[]) {
  if (typeof window === "undefined" || !navigator.onLine || !entries.length) return;
  await supabase.from("conference_entries").upsert(entries.map(conferenceEntryToRow), { onConflict: "id" });
}

async function syncPitEntriesToSupabase(entries: PitEntry[]) {
  if (typeof window === "undefined" || !navigator.onLine || !entries.length) return;
  await supabase.from("pit_entries").upsert(entries.map(pitEntryToRow), { onConflict: "id" });
}

// ── Supabase reads (mentor page) ──────────────────────────────────────────────

export async function fetchAllConferenceEntries(): Promise<ConferenceEntry[]> {
  const { data, error } = await supabase
    .from("conference_entries")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToConferenceEntry);
}

export async function fetchAllPitEntries(): Promise<PitEntry[]> {
  const { data, error } = await supabase
    .from("pit_entries")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToPitEntry);
}

// ── Supabase deletes (mentor page) ───────────────────────────────────────────

export async function deleteConferenceEntries(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabase.from("conference_entries").delete().in("id", ids);
}

export async function deletePitEntries(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabase.from("pit_entries").delete().in("id", ids);
}

// ── Nuke everything ──────────────────────────────────────────────────────────

export async function deleteAllData(): Promise<void> {
  await supabase.from("conference_entries").delete().neq("id", "");
  await supabase.from("pit_entries").delete().neq("id", "");

  // Delete pit photos from storage
  try {
    const { data: folders } = await supabase.storage.from("robot-photos").list("");
    if (folders?.length) {
      for (const folder of folders) {
        const { data: files } = await supabase.storage
          .from("robot-photos")
          .list(folder.name, { limit: 200 });
        if (files?.length) {
          for (const file of files) {
            const { data: subfiles } = await supabase.storage
              .from("robot-photos")
              .list(`${folder.name}/${file.name}`, { limit: 200 });
            if (subfiles?.length) {
              await supabase.storage
                .from("robot-photos")
                .remove(subfiles.map((f) => `${folder.name}/${file.name}/${f.name}`));
            }
          }
        }
      }
    }
  } catch {
    // photo deletion is best-effort
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(CONFERENCE_STORAGE_KEY);
    localStorage.removeItem(PIT_STORAGE_KEY);
    window.dispatchEvent(new Event("scout-updated"));
  }
}

// ── Online recovery ───────────────────────────────────────────────────────────

export async function syncOnReconnect() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const localConference = loadConferenceEntries();
  const localPit = loadPitEntries();

  if (localConference.length) {
    await supabase
      .from("conference_entries")
      .upsert(localConference.map(conferenceEntryToRow), { onConflict: "id" })
      .then(() => {}, () => {});
  }
  if (localPit.length) {
    await supabase
      .from("pit_entries")
      .upsert(localPit.map(pitEntryToRow), { onConflict: "id" })
      .then(() => {}, () => {});
  }

  const [remoteConference, remotePit] = await Promise.all([
    fetchAllConferenceEntries(),
    fetchAllPitEntries(),
  ]);

  if (remoteConference.length) {
    const byId = new Map(localConference.map((e) => [e.id, e]));
    remoteConference.forEach((r) => {
      const local = byId.get(r.id);
      if (!local || r.timestamp > local.timestamp) byId.set(r.id, r);
    });
    const merged = [...byId.values()].sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(CONFERENCE_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event("scout-updated"));
  }

  if (remotePit.length) {
    const byId = new Map(localPit.map((e) => [e.id, e]));
    remotePit.forEach((r) => {
      const local = byId.get(r.id);
      if (!local || r.timestamp > local.timestamp) byId.set(r.id, r);
    });
    const merged = [...byId.values()].sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(PIT_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event("scout-updated"));
  }
}
