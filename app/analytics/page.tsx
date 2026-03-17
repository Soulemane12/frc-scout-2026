"use client";

import { useState, useEffect } from "react";
import { loadEntries } from "../lib/storage";
import { totalFuel, climbPts, avg, pct } from "../lib/types";
import type { ScoutingEntry } from "../lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, StatCard, ProgressBar, SectionDivider } from "../components/ui";
import { cn } from "../lib/utils";

const INACTIVE_LABELS: Record<string, string> = {
  defense: "Played defense",
  collect: "Collected fuel (yellow ball)",
  cross: "Crossed bump/trench",
  ferry: "Ferrying",
  wait: "Waited / nothing",
};

const CLIMB_CONFIG = [
  { key: "none", label: "No climb", sub: "0 pts", color: "bg-slate-300" },
  { key: "l1", label: "L1", sub: "10 pts", color: "bg-blue-400" },
  { key: "l2", label: "L2", sub: "20 pts", color: "bg-teal-500" },
  { key: "l3", label: "L3", sub: "30 pts", color: "bg-green-500" },
];

export default function AnalyticsPage() {
  const [entries, setEntries] = useState<ScoutingEntry[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const data = loadEntries();
      setEntries(data);
      setSelectedTeam((prev) => {
        if (prev) return prev;
        const teams = [...new Set(data.map((e) => e.teamNumber))].sort((a, b) => Number(a) - Number(b));
        return teams[0] ?? "";
      });
    };
    update();
    window.addEventListener("scout-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("scout-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

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

  if (!entries.length) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">REBUILT 2026</p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400 font-medium">No data yet</p>
          <p className="text-sm text-slate-400 mt-1">Scout some matches to see analytics</p>
        </div>
      </main>
    );
  }

  // Per-team stats
  const avgFuelVal = avg(te.map(totalFuel));
  const avgCyclesVal = avg(te.map((e) => e.cycles));
  const avgFuelPerCycleVal = avg(te.map((e) => e.yellowPerCycle));
  const avgClimbPtsVal = avg(te.map(climbPts));
  const mobilityRate = pct(te.filter((e) => e.autoMobility === "yes").length, n);
  const autoClimbRate = pct(te.filter((e) => e.autoClimb === "yes").length, n);
  const winRate = pct(te.filter((e) => e.allianceWinner === e.allianceColor).length, n);
  const disabledRate = pct(te.filter((e) => e.robotDisabled === "yes").length, n);
  const hpDirectRate = pct(te.filter((e) => e.hpDirectScore === "yes").length, n);
  const avgHpRating = avg(te.filter((e) => e.throwerRating > 0).map((e) => e.throwerRating));

  const climbDist = {
    none: te.filter((e) => !e.teleopClimb || e.teleopClimb === "no").length,
    l1: te.filter((e) => e.teleopClimb === "l1").length,
    l2: te.filter((e) => e.teleopClimb === "l2").length,
    l3: te.filter((e) => e.teleopClimb === "l3").length,
  };

  const inactiveDist: Record<string, number> = {};
  te.forEach((e) => {
    (e.inactiveHubBehavior ?? []).forEach((behavior) => {
      inactiveDist[behavior] = (inactiveDist[behavior] ?? 0) + 1;
    });
  });

  const mostScouted = uniqueTeams.reduce((best, t) =>
    entries.filter((e) => e.teamNumber === t).length > entries.filter((e) => e.teamNumber === best).length ? t : best,
    uniqueTeams[0]
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">REBUILT 2026</p>
      </div>

      {/* ── Overview ── */}
      <SectionDivider title="Overview" />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Matches" value={entries.length} />
        <StatCard label="Teams" value={uniqueTeams.length} />
        <StatCard
          label="Most scouted"
          value={`#${mostScouted}`}
          sub={`${entries.filter((e) => e.teamNumber === mostScouted).length} matches`}
        />
      </div>

      {/* ── Team Selector ── */}
      <SectionDivider title="Team Breakdown" />

      <Card>
        <CardHeader>
          <CardTitle>Select Team</CardTitle>
        </CardHeader>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Matches Scouted" value={n} />
        <StatCard label="Avg Total Fuel (Yellow Ball)" value={avgFuelVal.toFixed(1)} sub="auto + teleop est." accent="border-l-blue-500" />
        <StatCard label="Avg Cycles" value={avgCyclesVal.toFixed(1)} />
        <StatCard label="Avg Fuel (Yellow Ball) / Cycle" value={avgFuelPerCycleVal.toFixed(1)} />
        <StatCard label="Avg Climb Pts" value={avgClimbPtsVal.toFixed(0)} accent="border-l-teal-500" />
        <StatCard label="Win Rate" value={`${winRate}%`} accent={winRate >= 50 ? "border-l-green-500" : "border-l-red-400"} />
        <StatCard label="Mobility Rate" value={`${mobilityRate}%`} />
        <StatCard label="Auto Climb Rate" value={`${autoClimbRate}%`} />
        <StatCard label="HP Direct Score" value={`${hpDirectRate}%`} />
        <StatCard label="Avg HP Rating" value={avgHpRating > 0 ? `${avgHpRating.toFixed(1)} ★` : "—"} />
      </div>

      {/* Reliability warning */}
      {disabledRate > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-red-500 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Reliability Warning</p>
            <p className="text-xs text-red-600">
              Robot disabled or broke down in {disabledRate}% of scouted matches
            </p>
          </div>
        </div>
      )}

      {/* Climb distribution */}
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
                    <span className="text-xs font-semibold text-slate-600">
                      {count}/{n} <span className="text-slate-400">({p}%)</span>
                    </span>
                  </div>
                  <ProgressBar pct={p} color={color} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inactive hub behavior */}
      {Object.keys(inactiveDist).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Hub Behavior</CardTitle>
            <CardDescription>What does this team do when their hub is off?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Object.entries(inactiveDist)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => {
                  const p = pct(count, n);
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{INACTIVE_LABELS[key] ?? key}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {count}/{n} <span className="text-slate-400">({p}%)</span>
                        </span>
                      </div>
                      <ProgressBar pct={p} color="bg-blue-400" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Leaderboard ── */}
      <SectionDivider title="Team Leaderboard" />

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>Ranked by average total fuel (yellow ball) scored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-slate-100">
            {leaderboard.map((row, i) => (
              <button
                key={row.team}
                onClick={() => setSelectedTeam(row.team)}
                className={cn(
                  "flex items-center justify-between py-3 px-2 rounded-lg text-sm transition-colors -mx-2",
                  team === row.team
                    ? "bg-blue-50 text-blue-900"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 text-center text-xs font-bold",
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"
                  )}>
                    #{i + 1}
                  </span>
                  <span className="font-semibold">Team {row.team}</span>
                  <span className="text-slate-400 text-xs">{row.matches} match{row.matches !== 1 ? "es" : ""}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span><span className="font-semibold text-slate-700">{row.avgFuel.toFixed(0)}</span> avg fuel (yellow ball)</span>
                  <span><span className="font-semibold text-slate-700">{row.avgClimb.toFixed(0)}</span> avg climb pts</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="pb-4" />
    </main>
  );
}
