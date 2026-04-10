"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAllMatchEntries, fetchAllPitEntries, deleteMatchEntries, deletePitEntries, deleteAllData, STORAGE_KEY, PIT_STORAGE_KEY } from "../lib/storage";
import { totalFuel, climbPts, avg, pct } from "../lib/types";
import type { ScoutingEntry, PitEntry } from "../lib/types";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  StatCard, ProgressBar, SectionDivider, Button,
} from "../components/ui";
import { cn } from "../lib/utils";

// ── Shared config ─────────────────────────────────────────────────────────────

const INACTIVE_LABELS: Record<string, string> = {
  defense: "Played defense",
  collect: "Collected fuel (yellow ball)",
  cross: "Crossed bump/trench",
  ferry: "Ferrying",
  wait: "Waited / nothing",
};

const CLIMB_CONFIG = [
  { key: "none", label: "No climb", sub: "0 pts", color: "bg-slate-300" },
  { key: "l1",   label: "L1",       sub: "10 pts", color: "bg-blue-400" },
  { key: "l2",   label: "L2",       sub: "20 pts", color: "bg-teal-500" },
  { key: "l3",   label: "L3",       sub: "30 pts", color: "bg-green-500" },
];

const CLIMB_LABEL: Record<string, string> = { none: "No climb", l1: "L1", l2: "L2", l3: "L3" };
const COLLECTION_LABELS: Record<string, string> = { depot: "Depot", floor: "Floor pickup", "hp-pass": "HP pass" };
const RANGE_LABELS: Record<string, string> = { close: "Close range", mid: "Mid range", far: "Far range" };
const AUTO_LABELS: Record<string, string> = { fuel: "Scores fuel", climb: "Climbs L1", trench: "Crosses trench", move: "Just moves", nothing: "Nothing" };
const HUB_ADAPTATION_LABELS: Record<string, string> = {
  defense: "Defense",
  collect: "Collect fuel",
  cross: "Cross bump/trench",
  ferry: "Ferrying",
  wait: "Waited / nothing",
};

function arrayField(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}

// ── Match Analytics ───────────────────────────────────────────────────────────

function MatchAnalytics({ entries }: { entries: ScoutingEntry[] }) {
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  useEffect(() => {
    setSelectedTeam((prev) => {
      if (prev) return prev;
      const teams = [...new Set(entries.map((e) => e.teamNumber))].sort((a, b) => Number(a) - Number(b));
      return teams[0] ?? "";
    });
  }, [entries]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-slate-400 font-medium">No match data yet</p>
        <p className="text-sm text-slate-400 mt-1">Entries will appear here once scouters submit</p>
      </div>
    );
  }

  const uniqueTeams = [...new Set(entries.map((e) => e.teamNumber))].sort((a, b) => Number(a) - Number(b));
  const team = selectedTeam || uniqueTeams[0] || "";
  const te = entries.filter((e) => e.teamNumber === team);
  const n = te.length;

  const leaderboard = uniqueTeams
    .map((t) => {
      const es = entries.filter((e) => e.teamNumber === t);
      return { team: t, avgFuel: avg(es.map(totalFuel)), avgClimb: avg(es.map(climbPts)), matches: es.length };
    })
    .sort((a, b) => b.avgFuel - a.avgFuel);

  const avgFuelVal = avg(te.map(totalFuel));
  const avgCyclesVal = avg(te.map((e) => e.cycles));
  const avgFuelPerCycleVal = avg(te.map((e) => e.yellowPerCycle));
  const avgClimbPtsVal = avg(te.map(climbPts));
  const mobilityRate = pct(te.filter((e) => e.autoMobility === "yes").length, n);
  const autoClimbRate = pct(te.filter((e) => e.autoClimb === "yes").length, n);
  const winRate = pct(te.filter((e) => e.allianceWinner === e.allianceColor).length, n);
  const disabledRate = pct(te.filter((e) => e.robotDisabled === "yes").length, n);

  const climbDist = {
    none: te.filter((e) => !e.teleopClimb || e.teleopClimb === "no").length,
    l1: te.filter((e) => e.teleopClimb === "l1").length,
    l2: te.filter((e) => e.teleopClimb === "l2").length,
    l3: te.filter((e) => e.teleopClimb === "l3").length,
  };

  const inactiveDist: Record<string, number> = {};
  te.forEach((e) => {
    (e.inactiveHubBehavior ?? []).forEach((b) => {
      inactiveDist[b] = (inactiveDist[b] ?? 0) + 1;
    });
  });

  const mostScouted = uniqueTeams.reduce((best, t) =>
    entries.filter((e) => e.teamNumber === t).length > entries.filter((e) => e.teamNumber === best).length ? t : best,
    uniqueTeams[0]
  );

  return (
    <>
      <SectionDivider title="Overview" />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Matches" value={entries.length} />
        <StatCard label="Teams" value={uniqueTeams.length} />
        <StatCard label="Most scouted" value={`#${mostScouted}`} sub={`${entries.filter((e) => e.teamNumber === mostScouted).length} matches`} />
      </div>

      <SectionDivider title="Team Breakdown" />

      <Card>
        <CardHeader><CardTitle>Select Team</CardTitle></CardHeader>
        <CardContent>
          <select
            value={team}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {uniqueTeams.map((t) => (
              <option key={t} value={t}>
                Team {t} — {entries.filter((e) => e.teamNumber === t).length} match{entries.filter((e) => e.teamNumber === t).length !== 1 ? "es" : ""}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Matches Scouted" value={n} />
        <StatCard label="Avg Total Fuel" value={avgFuelVal.toFixed(1)} sub="auto + teleop est." accent="border-l-blue-500" />
        <StatCard label="Avg Cycles" value={avgCyclesVal.toFixed(1)} />
        <StatCard label="Avg Fuel / Cycle" value={avgFuelPerCycleVal.toFixed(1)} />
        <StatCard label="Avg Climb Pts" value={avgClimbPtsVal.toFixed(0)} accent="border-l-teal-500" />
        <StatCard label="Win Rate" value={`${winRate}%`} accent={winRate >= 50 ? "border-l-green-500" : "border-l-red-400"} />
        <StatCard label="Mobility Rate" value={`${mobilityRate}%`} />
        <StatCard label="Auto Climb Rate" value={`${autoClimbRate}%`} />
      </div>

      {disabledRate > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-red-500 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Reliability Warning</p>
            <p className="text-xs text-red-600">Robot disabled or broke down in {disabledRate}% of scouted matches</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Endgame Climb Distribution</CardTitle>
          <CardDescription>How often does this team reach each climb level?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {CLIMB_CONFIG.map(({ key, label, sub, color }) => {
              const count = climbDist[key as keyof typeof climbDist];
              const p = pct(count, n);
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="ml-1.5 text-slate-400 text-xs">{sub}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{count}/{n} <span className="text-slate-400">({p}%)</span></span>
                  </div>
                  <ProgressBar pct={p} color={color} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {Object.keys(inactiveDist).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Hub Behavior</CardTitle>
            <CardDescription>What does this team do when their hub is off?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Object.entries(inactiveDist).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
                const p = pct(count, n);
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{INACTIVE_LABELS[key] ?? key}</span>
                      <span className="text-xs font-semibold text-slate-600">{count}/{n} <span className="text-slate-400">({p}%)</span></span>
                    </div>
                    <ProgressBar pct={p} color="bg-blue-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <SectionDivider title="Team Leaderboard" />

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>Ranked by average total fuel scored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-slate-100">
            {leaderboard.map((row, i) => (
              <button
                key={row.team}
                onClick={() => setSelectedTeam(row.team)}
                className={cn(
                  "flex items-center justify-between py-3 px-2 rounded-lg text-sm transition-colors -mx-2",
                  team === row.team ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("w-6 text-center text-xs font-bold",
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"
                  )}>#{i + 1}</span>
                  <span className="font-semibold">Team {row.team}</span>
                  <span className="text-slate-400 text-xs">{row.matches} match{row.matches !== 1 ? "es" : ""}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span><span className="font-semibold text-slate-700">{row.avgFuel.toFixed(0)}</span> avg fuel</span>
                  <span><span className="font-semibold text-slate-700">{row.avgClimb.toFixed(0)}</span> avg climb pts</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ── Pit Analytics ─────────────────────────────────────────────────────────────

function PitAnalytics({ entries, matchEntries }: { entries: PitEntry[]; matchEntries: ScoutingEntry[] }) {
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  useEffect(() => {
    setSelectedTeam((prev) => {
      if (prev) return prev;
      const teams = [...new Set(entries.map((e) => e.teamNumber))].sort((a, b) => Number(a) - Number(b));
      return teams[0] ?? "";
    });
  }, [entries]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-slate-400 font-medium">No pit data yet</p>
        <p className="text-sm text-slate-400 mt-1">Entries will appear here once scouters submit</p>
      </div>
    );
  }

  const uniqueTeams = [...new Set(entries.map((e) => e.teamNumber))].sort((a, b) => Number(a) - Number(b));
  const team = selectedTeam || uniqueTeams[0] || "";
  const pit = entries.find((e) => e.teamNumber === team);

  const visionCount = entries.filter((e) => e.usesVision === "yes").length;
  const climbCapable = entries.filter((e) => ["l1", "l2", "l3"].includes(e.maxClimb)).length;
  const adaptCount = entries.filter((e) => arrayField(e.hubAdaptation).length > 0).length;
  const oppHubCount = entries.filter((e) => e.scoreOpponentHub === "yes").length;

  const climbFleet: Record<string, number> = { none: 0, l1: 0, l2: 0, l3: 0 };
  entries.forEach((e) => { climbFleet[e.maxClimb] = (climbFleet[e.maxClimb] ?? 0) + 1; });

  const driveFleet: Record<string, number> = {};
  entries.forEach((e) => { if (e.drivetrainType) driveFleet[e.drivetrainType] = (driveFleet[e.drivetrainType] ?? 0) + 1; });

  const n = entries.length;

  return (
    <>
      <SectionDivider title="Fleet Overview" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Teams Scouted" value={n} />
        <StatCard label="Climb Capable" value={`${climbCapable}/${n}`} sub="L1 or higher" accent="border-l-teal-500" />
        <StatCard label="Hub Adaptation" value={`${adaptCount}/${n}`} sub="adapt when inactive" accent="border-l-blue-500" />
        <StatCard label="Scores Opp. Hub" value={`${oppHubCount}/${n}`} accent="border-l-yellow-500" />
        <StatCard label="Uses Vision" value={`${visionCount}/${n}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Max Climb Distribution</CardTitle>
          <CardDescription>Across all scouted teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {CLIMB_CONFIG.map(({ key, label, sub, color }) => {
              const count = climbFleet[key] ?? 0;
              const p = pct(count, n);
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="ml-1.5 text-xs text-slate-400">{sub}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{count}/{n} <span className="text-slate-400">({p}%)</span></span>
                  </div>
                  <ProgressBar pct={p} color={color} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {Object.keys(driveFleet).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Drivetrain Types</CardTitle>
            <CardDescription>Across all scouted teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Object.entries(driveFleet).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const p = pct(count, n);
                return (
                  <div key={type}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 capitalize">{type}</span>
                      <span className="text-xs font-semibold text-slate-600">{count}/{n} <span className="text-slate-400">({p}%)</span></span>
                    </div>
                    <ProgressBar pct={p} color="bg-blue-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <SectionDivider title="Team Profile" />

      <Card>
        <CardHeader><CardTitle>Select Team</CardTitle></CardHeader>
        <CardContent>
          <select
            value={team}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {uniqueTeams.map((t) => {
              const p = entries.find((e) => e.teamNumber === t);
              return (
                <option key={t} value={t}>
                  Team {t}{p?.robotName ? ` — ${p.robotName}` : ""}
                </option>
              );
            })}
          </select>
        </CardContent>
      </Card>

      {pit && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Drivetrain" value={pit.drivetrainType || "—"} />
            <StatCard label="Max Climb" value={CLIMB_LABEL[pit.maxClimb] ?? "—"} accent="border-l-teal-500" />
            <StatCard
              label="Hub Adaptation"
              value={arrayField(pit.hubAdaptation).length ? arrayField(pit.hubAdaptation).map((v) => HUB_ADAPTATION_LABELS[v] ?? v).join(", ") : "—"}
              accent={arrayField(pit.hubAdaptation).length ? "border-l-green-500" : "border-l-red-400"}
            />
            <StatCard label="Scores Opp. Hub" value={pit.scoreOpponentHub || "—"} />
            <StatCard label="Fits Trench" value={pit.fitsUnderTrench || "—"} />
            <StatCard label="Crosses Bump" value={pit.crossesBump || "—"} />
            <StatCard label="Uses Vision" value={pit.usesVision || "—"} />
            <StatCard label="Est. Pts / Match" value={pit.estimatedPoints || "—"} />
          </div>

          <Card>
            <CardHeader><CardTitle>Fuel Collection & Shooting</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Collection method</p>
                  <div className="flex flex-wrap gap-2">
                    {pit.fuelCollection.length ? pit.fuelCollection.map((c) => (
                      <span key={c} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{COLLECTION_LABELS[c] ?? c}</span>
                    )) : <span className="text-slate-400">—</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Shoot range</p>
                  <div className="flex flex-wrap gap-2">
                    {pit.shootRange.length ? pit.shootRange.map((r) => (
                      <span key={r} className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">{RANGE_LABELS[r] ?? r}</span>
                    )) : <span className="text-slate-400">—</span>}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Est. cycles / match</p>
                    <p className="text-lg font-bold text-slate-900">{pit.cyclesEstimate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Shoots while moving</p>
                    <p className="text-lg font-bold text-slate-900 capitalize">{pit.shootsWhileMoving || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Auto Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {pit.autoActions.length ? pit.autoActions.map((a) => (
                  <span key={a} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{AUTO_LABELS[a] ?? a}</span>
                )) : <span className="text-sm text-slate-400">—</span>}
              </div>
              {pit.autoConsistency && (
                <p className="text-sm text-slate-600">Consistency: <span className="font-semibold capitalize text-slate-800">{pit.autoConsistency}</span></p>
              )}
            </CardContent>
          </Card>

          {(pit.robotPhotoUrls ?? []).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Robot Photos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {(pit.robotPhotoUrls ?? []).map((photo, i) => (
                    <img
                      key={`${pit.id}-photo-${i}`}
                      src={photo}
                      alt={`Team ${pit.teamNumber} robot photo ${i + 1}`}
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(pit.strengths || pit.weaknesses || pit.notes) && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
              {pit.strengths && <p><span className="font-semibold text-slate-500">Strengths: </span><span className="text-slate-700">{pit.strengths}</span></p>}
              {pit.weaknesses && <p><span className="font-semibold text-slate-500">Weaknesses: </span><span className="text-slate-700">{pit.weaknesses}</span></p>}
              {pit.notes && <p><span className="font-semibold text-slate-500">Notes: </span><span className="text-slate-700">{pit.notes}</span></p>}
            </div>
          )}

          {(() => {
            const teamMatchEntries = matchEntries.filter((e) => e.teamNumber === team);
            const notes = teamMatchEntries.filter(
              (e) => e.defense || e.strengths || e.weaknesses || e.lossReason
            );
            if (!notes.length) return null;
            return (
              <Card>
                <CardHeader>
                  <CardTitle>What Scouters Said</CardTitle>
                  <CardDescription>{notes.length} match observation{notes.length !== 1 ? "s" : ""} for Team {team}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col divide-y divide-slate-100">
                    {notes.map((e) => (
                      <div key={e.id} className="py-3 flex flex-col gap-1.5 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "rounded px-2 py-0.5 text-xs font-bold text-white",
                            e.allianceColor === "blue" ? "bg-blue-500" : "bg-red-500"
                          )}>
                            Match {e.matchNumber}
                          </span>
                          <span className="text-xs text-slate-400">by {e.scouter || "unknown"}</span>
                          {e.allianceWinner !== e.allianceColor && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">L</span>
                          )}
                          {e.allianceWinner === e.allianceColor && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">W</span>
                          )}
                        </div>
                        {e.defense && <p><span className="font-semibold text-slate-500">Defense: </span><span className="text-slate-700">{e.defense}</span></p>}
                        {e.strengths && <p><span className="font-semibold text-slate-500">Strengths: </span><span className="text-slate-700">{e.strengths}</span></p>}
                        {e.weaknesses && <p><span className="font-semibold text-slate-500">Weaknesses: </span><span className="text-slate-700">{e.weaknesses}</span></p>}
                        {e.lossReason && <p><span className="font-semibold text-red-500">Loss reason: </span><span className="text-slate-700">{e.lossReason}</span></p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <SectionDivider title="Team Comparison" />

          <Card>
            <CardHeader>
              <CardTitle>All Teams</CardTitle>
              <CardDescription>Ranked by estimated points per match</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y divide-slate-100">
                {[...entries]
                  .sort((a, b) => Number(b.estimatedPoints || 0) - Number(a.estimatedPoints || 0))
                  .map((e, i) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedTeam(e.teamNumber)}
                      className={cn(
                        "flex items-center justify-between py-3 px-2 rounded-lg text-sm transition-colors -mx-2",
                        team === e.teamNumber ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("w-6 text-center text-xs font-bold",
                          i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"
                        )}>#{i + 1}</span>
                        <span className="font-semibold">Team {e.teamNumber}</span>
                        {e.robotName && <span className="text-slate-400 text-xs">{e.robotName}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={cn("rounded-full px-2 py-0.5 font-semibold",
                          e.maxClimb === "l3" ? "bg-green-100 text-green-700" :
                          e.maxClimb === "l2" ? "bg-teal-100 text-teal-700" :
                          e.maxClimb === "l1" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                        )}>{CLIMB_LABEL[e.maxClimb] ?? "—"}</span>
                        {e.estimatedPoints && <span><span className="font-semibold text-slate-700">{e.estimatedPoints}</span> est. pts</span>}
                      </div>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

// ── Mentor Page ───────────────────────────────────────────────────────────────

export default function MentorPage() {
  const [matchEntries, setMatchEntries] = useState<ScoutingEntry[]>([]);
  const [pitEntries, setPitEntries] = useState<PitEntry[]>([]);
  const [tab, setTab] = useState<"match" | "pit">("match");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [match, pit] = await Promise.all([
        fetchAllMatchEntries(),
        fetchAllPitEntries(),
      ]);
      setMatchEntries(match);
      setPitEntries(pit);
    } catch {
      setError("Failed to load from Supabase. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mentor Dashboard</h1>
          <p className="text-sm text-slate-500">All submissions from all devices · Supabase</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-400 font-medium">Loading from Supabase…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Match Entries" value={matchEntries.length} accent="border-l-blue-500" />
            <StatCard label="Total Pit Entries" value={pitEntries.length} accent="border-l-teal-500" />
          </div>

          {/* ── Manage Data ── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => { setManageOpen((o) => !o); setSelected(new Set()); }}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left"
            >
              <span className="text-sm font-semibold text-slate-800">Manage Data</span>
              <span className="text-slate-400 text-sm">{manageOpen ? "▲ Close" : "▼ Open"}</span>
            </button>

            {manageOpen && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 flex flex-col gap-3">
                {/* Nuke button */}
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Delete ALL Data</p>
                    <p className="text-xs text-red-500 mt-0.5">Wipes every match entry, pit entry, and robot photo. Cannot be undone.</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting}
                    onClick={async () => {
                      if (!confirm("Delete ALL match entries, pit entries, and robot photos? This cannot be undone.")) return;
                      setDeleting(true);
                      await deleteAllData();
                      setMatchEntries([]);
                      setPitEntries([]);
                      setSelected(new Set());
                      setDeleting(false);
                    }}
                  >
                    {deleting ? "Deleting…" : "Delete All"}
                  </Button>
                </div>

                {/* Tab selector */}
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
                  {(["match", "pit"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setSelected(new Set()); setDateFilter(""); }}
                      className={cn(
                        "rounded-md px-4 py-1 text-xs font-semibold transition-all capitalize",
                        tab === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Date filter */}
                {(() => {
                  const allList = tab === "match" ? matchEntries : pitEntries;
                  const filtered = dateFilter
                    ? allList.filter((e) => new Date(e.timestamp).toLocaleDateString() === new Date(dateFilter).toLocaleDateString())
                    : allList;
                  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter by date</label>
                          <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setSelected(new Set()); }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {dateFilter && (
                          <button
                            onClick={() => { setDateFilter(""); setSelected(new Set()); }}
                            className="mt-5 text-xs font-semibold text-slate-400 hover:text-slate-700"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => {
                              if (allSelected) {
                                setSelected(new Set());
                              } else {
                                setSelected(new Set(filtered.map((e) => e.id)));
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Select all ({filtered.length}{dateFilter ? " on this date" : ""})
                        </label>
                        {selected.size > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleting}
                            onClick={async () => {
                              if (!confirm(`Delete ${selected.size} entr${selected.size !== 1 ? "ies" : "y"}? This cannot be undone.`)) return;
                              setDeleting(true);
                              const ids = [...selected];
                              if (tab === "match") {
                                await deleteMatchEntries(ids);
                                setMatchEntries((prev) => prev.filter((e) => !selected.has(e.id)));
                                try {
                                  const local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
                                  localStorage.setItem(STORAGE_KEY, JSON.stringify(local.filter((e: { id: string }) => !selected.has(e.id))));
                                } catch {}
                              } else {
                                await deletePitEntries(ids);
                                setPitEntries((prev) => prev.filter((e) => !selected.has(e.id)));
                                try {
                                  const local = JSON.parse(localStorage.getItem(PIT_STORAGE_KEY) ?? "[]");
                                  localStorage.setItem(PIT_STORAGE_KEY, JSON.stringify(local.filter((e: { id: string }) => !selected.has(e.id))));
                                } catch {}
                              }
                              setSelected(new Set());
                              setDeleting(false);
                            }}
                          >
                            {deleting ? "Deleting…" : `Delete ${selected.size} selected`}
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                        {filtered.map((e) => {
                          const label = tab === "match"
                            ? `Team ${(e as ScoutingEntry).teamNumber} · Match ${(e as ScoutingEntry).matchNumber} · ${(e as ScoutingEntry).scouter || "—"}`
                            : `Team ${(e as PitEntry).teamNumber}${(e as PitEntry).robotName ? ` · ${(e as PitEntry).robotName}` : ""} · ${(e as PitEntry).scouter || "—"}`;
                          return (
                            <label key={e.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm cursor-pointer hover:bg-slate-100">
                              <input
                                type="checkbox"
                                checked={selected.has(e.id)}
                                onChange={() => {
                                  setSelected((prev) => {
                                    const next = new Set(prev);
                                    next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                                    return next;
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 flex-shrink-0"
                              />
                              <span className="text-slate-700">{label}</span>
                              <span className="ml-auto text-xs text-slate-400 shrink-0">{new Date(e.timestamp).toLocaleDateString()}</span>
                            </label>
                          );
                        })}
                        {filtered.length === 0 && (
                          <p className="text-sm text-slate-400 py-4 text-center">
                            {dateFilter ? "No entries on this date" : "No entries"}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
            {(["match", "pit"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-5 py-1.5 text-sm font-semibold transition-all capitalize",
                  tab === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "match"
            ? <MatchAnalytics entries={matchEntries} />
            : <PitAnalytics entries={pitEntries} matchEntries={matchEntries} />
          }
        </>
      )}

      <div className="pb-4" />
    </main>
  );
}
