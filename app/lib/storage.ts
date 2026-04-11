import type { ScoutingEntry, PitEntry } from "./types";
import { supabase } from "./supabase";

export const STORAGE_KEY = "frc-scout-2026";
export const PIT_STORAGE_KEY = "frc-pit-2026";

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}

// ── Local storage (unchanged API) ────────────────────────────────────────────

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
  syncMatchEntriesToSupabase(entries).catch(() => {});
}

export function loadPitEntries(): PitEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const entries = JSON.parse(localStorage.getItem(PIT_STORAGE_KEY) ?? "[]") as Array<Record<string, unknown>>;
    return entries.map((entry) => ({
      ...entry,
      fuelCollection: stringArray(entry.fuelCollection),
      shootRange: stringArray(entry.shootRange),
      hubAdaptation: stringArray(entry.hubAdaptation),
      autoActions: stringArray(entry.autoActions),
      robotPhotoUrls: stringArray(entry.robotPhotoUrls),
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

function matchEntryToRow(e: ScoutingEntry) {
  return {
    id:                     e.id,
    timestamp:              e.timestamp,
    scouter:                e.scouter,
    match_number:           e.matchNumber,
    team_number:            e.teamNumber,
    alliance_color:         e.allianceColor,
    starting_position:      e.startingPosition,
    preloaded:              e.preloaded,
    auto_cycles:            e.autoCycles,
    auto_yellow_per_cycle:  e.autoYellowPerCycle,
    auto_mobility:          e.autoMobility,
    auto_climb:             e.autoClimb,
    cycles:                 e.cycles,
    yellow_per_cycle:       e.yellowPerCycle,
    inactive_hub_behavior:  e.inactiveHubBehavior,
    teleop_climb:           e.teleopClimb,
    stay_on:                e.stayOn,
    hp_direct_score:        e.hpDirectScore,
    thrower_rating:         e.throwerRating,
    robot_disabled:         e.robotDisabled,
    alliance_winner:        e.allianceWinner,
    yellow_card:            e.yellowCard,
    defense:                e.defense,
    strengths:              e.strengths,
    weaknesses:             e.weaknesses,
    loss_reason:            e.lossReason,
  };
}

function rowToMatchEntry(row: Record<string, unknown>): ScoutingEntry {
  return {
    id:                   row.id as string,
    timestamp:            row.timestamp as number,
    scouter:              (row.scouter as string) ?? "",
    matchNumber:          (row.match_number as string) ?? "",
    teamNumber:           (row.team_number as string) ?? "",
    allianceColor:        (row.alliance_color as string) ?? "",
    startingPosition:     (row.starting_position as string) ?? "",
    preloaded:            (row.preloaded as string) ?? "",
    autoCycles:           (row.auto_cycles as number) ?? 0,
    autoYellowPerCycle:   (row.auto_yellow_per_cycle as number) ?? 0,
    autoMobility:         (row.auto_mobility as string) ?? "",
    autoClimb:            (row.auto_climb as string) ?? "",
    cycles:               (row.cycles as number) ?? 0,
    yellowPerCycle:       (row.yellow_per_cycle as number) ?? 0,
    inactiveHubBehavior:  (row.inactive_hub_behavior as string[]) ?? [],
    teleopClimb:          (row.teleop_climb as string) ?? "",
    stayOn:               (row.stay_on as string) ?? "",
    hpDirectScore:        (row.hp_direct_score as string) ?? "",
    throwerRating:        (row.thrower_rating as number) ?? 0,
    robotDisabled:        (row.robot_disabled as string) ?? "",
    allianceWinner:       (row.alliance_winner as string) ?? "",
    yellowCard:           (row.yellow_card as string) ?? "",
    defense:              (row.defense as string) ?? "",
    strengths:            (row.strengths as string) ?? "",
    weaknesses:           (row.weaknesses as string) ?? "",
    lossReason:           (row.loss_reason as string) ?? "",
  };
}

function pitEntryToRow(e: PitEntry) {
  return {
    id:                   e.id,
    timestamp:            e.timestamp,
    scouter:              e.scouter,
    team_number:          e.teamNumber,
    robot_name:           e.robotName,
    motors:               e.motors,
    drivetrain_type:      e.drivetrainType,
    fits_under_trench:    e.fitsUnderTrench,
    crosses_bump:         e.crossesBump,
    fuel_collection:      stringArray(e.fuelCollection),
    shoot_range:          stringArray(e.shootRange),
    cycles_estimate:      e.cyclesEstimate,
    shoots_while_moving:  e.shootsWhileMoving,
    hub_adaptation:       stringArray(e.hubAdaptation),
    score_opponent_hub:   e.scoreOpponentHub,
    auto_actions:         stringArray(e.autoActions),
    auto_consistency:     e.autoConsistency,
    max_climb:            e.maxClimb,
    climb_consistency:    e.climbConsistency,
    uses_vision:          e.usesVision,
    estimated_points:     e.estimatedPoints,
    robot_photo_urls:     stringArray(e.robotPhotoUrls),
    strengths:            e.strengths,
    weaknesses:           e.weaknesses,
    notes:                e.notes,
  };
}

function rowToPitEntry(row: Record<string, unknown>): PitEntry {
  return {
    id:                  row.id as string,
    timestamp:           row.timestamp as number,
    scouter:             (row.scouter as string) ?? "",
    teamNumber:          (row.team_number as string) ?? "",
    robotName:           (row.robot_name as string) ?? "",
    motors:              (row.motors as string) ?? "",
    drivetrainType:      (row.drivetrain_type as string) ?? "",
    fitsUnderTrench:     (row.fits_under_trench as string) ?? "",
    crossesBump:         (row.crosses_bump as string) ?? "",
    fuelCollection:      stringArray(row.fuel_collection),
    shootRange:          stringArray(row.shoot_range),
    cyclesEstimate:      (row.cycles_estimate as number) ?? 0,
    shootsWhileMoving:   (row.shoots_while_moving as string) ?? "",
    hubAdaptation:       stringArray(row.hub_adaptation),
    scoreOpponentHub:    (row.score_opponent_hub as string) ?? "",
    autoActions:         stringArray(row.auto_actions),
    autoConsistency:     (row.auto_consistency as string) ?? "",
    maxClimb:            (row.max_climb as string) ?? "",
    climbConsistency:    (row.climb_consistency as string) ?? "",
    usesVision:          (row.uses_vision as string) ?? "",
    estimatedPoints:     (row.estimated_points as string) ?? "",
    robotPhotoUrls:      stringArray(row.robot_photo_urls),
    strengths:           (row.strengths as string) ?? "",
    weaknesses:          (row.weaknesses as string) ?? "",
    notes:               (row.notes as string) ?? "",
  };
}

// ── Background sync ───────────────────────────────────────────────────────────

async function syncMatchEntriesToSupabase(entries: ScoutingEntry[]) {
  if (typeof window === "undefined" || !navigator.onLine || !entries.length) return;
  await supabase.from("match_entries").upsert(entries.map(matchEntryToRow), { onConflict: "id" });
}

async function syncPitEntriesToSupabase(entries: PitEntry[]) {
  if (typeof window === "undefined" || !navigator.onLine || !entries.length) return;
  await supabase.from("pit_entries").upsert(entries.map(pitEntryToRow), { onConflict: "id" });
}

// ── Supabase reads (mentor page) ──────────────────────────────────────────────

export async function fetchAllMatchEntries(): Promise<ScoutingEntry[]> {
  const { data, error } = await supabase
    .from("match_entries")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToMatchEntry);
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

export async function deleteMatchEntries(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabase.from("match_entries").delete().in("id", ids);
}

export async function deletePitEntries(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabase.from("pit_entries").delete().in("id", ids);
}

// ── Auto-purge data before cutoff date ───────────────────────────────────────

const PURGE_CUTOFF = new Date("2026-04-10T00:00:00.000Z").getTime();
const PURGE_FLAG = "frc-purged-before-2026-04-10";

export async function purgeOldData(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(PURGE_FLAG)) return; // already ran

  // Delete old rows from Supabase
  await supabase.from("match_entries").delete().lt("timestamp", PURGE_CUTOFF);
  await supabase.from("pit_entries").delete().lt("timestamp", PURGE_CUTOFF);

  // Clear old entries from localStorage
  try {
    const localMatch = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as { timestamp: number }[];
    const filteredMatch = localMatch.filter((e) => e.timestamp >= PURGE_CUTOFF);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMatch));

    const localPit = JSON.parse(localStorage.getItem(PIT_STORAGE_KEY) ?? "[]") as { timestamp: number }[];
    const filteredPit = localPit.filter((e) => e.timestamp >= PURGE_CUTOFF);
    localStorage.setItem(PIT_STORAGE_KEY, JSON.stringify(filteredPit));

    window.dispatchEvent(new Event("scout-updated"));
  } catch {
    // ignore parse errors
  }

  localStorage.setItem(PURGE_FLAG, "1");
}

// ── Nuke everything ──────────────────────────────────────────────────────────

export async function deleteAllData(): Promise<void> {
  // 1. Delete all DB rows
  await supabase.from("match_entries").delete().neq("id", "");
  await supabase.from("pit_entries").delete().neq("id", "");

  // 2. Delete robot photos: list top-level folders (team numbers) then remove files
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

  // 3. Clear this device's localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PIT_STORAGE_KEY);
    window.dispatchEvent(new Event("scout-updated"));
  }
}

// ── Online recovery ───────────────────────────────────────────────────────────

export async function syncOnReconnect() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const localMatch = loadEntries();
  const localPit = loadPitEntries();

  // Push local → Supabase
  if (localMatch.length) {
    await supabase
      .from("match_entries")
      .upsert(localMatch.map(matchEntryToRow), { onConflict: "id" })
      .then(() => {}, () => {});
  }
  if (localPit.length) {
    await supabase
      .from("pit_entries")
      .upsert(localPit.map(pitEntryToRow), { onConflict: "id" })
      .then(() => {}, () => {});
  }

  // Pull Supabase → merge into localStorage (newer timestamp wins)
  const [remoteMatch, remotePit] = await Promise.all([
    fetchAllMatchEntries(),
    fetchAllPitEntries(),
  ]);

  if (remoteMatch.length) {
    const byId = new Map(localMatch.map((e) => [e.id, e]));
    remoteMatch.forEach((r) => {
      const local = byId.get(r.id);
      if (!local || r.timestamp > local.timestamp) byId.set(r.id, r);
    });
    const merged = [...byId.values()].sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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
