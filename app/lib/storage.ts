import type { ScoutingEntry, PitEntry } from "./types";
import { supabase } from "./supabase";

export const STORAGE_KEY = "frc-scout-2026";
export const PIT_STORAGE_KEY = "frc-pit-2026";

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
    return JSON.parse(localStorage.getItem(PIT_STORAGE_KEY) ?? "[]");
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
    fuel_collection:      e.fuelCollection,
    shoot_range:          e.shootRange,
    cycles_estimate:      e.cyclesEstimate,
    shoots_while_moving:  e.shootsWhileMoving,
    hub_adaptation:       e.hubAdaptation,
    score_opponent_hub:   e.scoreOpponentHub,
    auto_actions:         e.autoActions,
    auto_consistency:     e.autoConsistency,
    max_climb:            e.maxClimb,
    climb_consistency:    e.climbConsistency,
    uses_vision:          e.usesVision,
    estimated_points:     e.estimatedPoints,
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
    fuelCollection:      (row.fuel_collection as string[]) ?? [],
    shootRange:          (row.shoot_range as string[]) ?? [],
    cyclesEstimate:      (row.cycles_estimate as number) ?? 0,
    shootsWhileMoving:   (row.shoots_while_moving as string) ?? "",
    hubAdaptation:       (row.hub_adaptation as string) ?? "",
    scoreOpponentHub:    (row.score_opponent_hub as string) ?? "",
    autoActions:         (row.auto_actions as string[]) ?? [],
    autoConsistency:     (row.auto_consistency as string) ?? "",
    maxClimb:            (row.max_climb as string) ?? "",
    climbConsistency:    (row.climb_consistency as string) ?? "",
    usesVision:          (row.uses_vision as string) ?? "",
    estimatedPoints:     (row.estimated_points as string) ?? "",
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
