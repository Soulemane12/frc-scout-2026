"use client";

import { useState, useEffect } from "react";
import { loadEntries, saveEntries } from "../lib/storage";
import { totalFuel } from "../lib/types";
import type { ScoutingEntry } from "../lib/types";
import { Button, Input, Badge } from "../components/ui";
import { cn } from "../lib/utils";

const CLIMB_LABEL: Record<string, string> = { no: "No climb", l1: "L1", l2: "L2", l3: "L3" };
const CLIMB_COLOR: Record<string, string> = { no: "slate", l1: "blue", l2: "teal", l3: "green" } as const;

function Row({ e, onDelete }: { e: ScoutingEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const fuel = totalFuel(e);
  const won = e.allianceWinner === e.allianceColor;

  return (
    <div className={cn("rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow", open && "shadow-md")}>
      {/* Header row */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {/* Alliance badge */}
        <span
          className={cn(
            "flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white",
            e.allianceColor === "blue" ? "bg-blue-500" : "bg-red-500"
          )}
        >
          {e.allianceColor?.toUpperCase() || "?"}
        </span>

        {/* Team + match */}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-900">Team {e.teamNumber}</span>
          <span className="ml-2 text-sm text-slate-400">Match {e.matchNumber}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
          <span className="font-medium text-slate-700">{fuel} fuel</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold",
              e.teleopClimb === "l3" ? "bg-green-100 text-green-700" :
              e.teleopClimb === "l2" ? "bg-teal-100 text-teal-700" :
              e.teleopClimb === "l1" ? "bg-blue-100 text-blue-700" :
              "bg-slate-100 text-slate-500"
            )}
          >
            {CLIMB_LABEL[e.teleopClimb] ?? "—"}
          </span>
          {won && <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-700">W</span>}
          {e.robotDisabled === "yes" && <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-600">DQ</span>}
        </div>

        <span className="text-slate-300 text-sm ml-1">{open ? "▲" : "▼"}</span>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {[
              ["Scouter", e.scouter || "—"],
              ["Starting pos.", e.startingPosition || "—"],
              ["Preloaded", e.preloaded || "—"],
              ["Auto fuel", e.autoFuelScored],
              ["Mobility", e.autoMobility || "—"],
              ["Auto climb", e.autoClimb || "—"],
              ["Cycles", e.cycles],
              ["Fuel / cycle", e.yellowPerCycle],
              ["Teleop fuel est.", e.cycles * e.yellowPerCycle],
              ["Inactive behavior", e.inactiveHubBehavior || "—"],
              ["Endgame climb", CLIMB_LABEL[e.teleopClimb] ?? "—"],
              ["Stayed on", e.stayOn || "—"],
              ["HP direct score", e.hpDirectScore || "—"],
              ["HP rating", e.throwerRating ? "★".repeat(e.throwerRating) : "—"],
              ["Disabled", e.robotDisabled || "—"],
              ["Winner", e.allianceWinner || "—"],
              ["Yellow card", e.yellowCard || "—"],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-xs font-medium text-slate-400">{k}</p>
                <p className="capitalize text-slate-800">{v}</p>
              </div>
            ))}
          </div>

          {(e.defense || e.strengths || e.weaknesses) && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg bg-slate-50 p-3 text-sm">
              {e.defense && (
                <p><span className="font-semibold text-slate-500">Defense: </span><span className="text-slate-700">{e.defense}</span></p>
              )}
              {e.strengths && (
                <p><span className="font-semibold text-slate-500">Strengths: </span><span className="text-slate-700">{e.strengths}</span></p>
              )}
              {e.weaknesses && (
                <p><span className="font-semibold text-slate-500">Weaknesses: </span><span className="text-slate-700">{e.weaknesses}</span></p>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{new Date(e.timestamp).toLocaleString()}</span>
            <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsPage() {
  const [entries, setEntries] = useState<ScoutingEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const update = () => setEntries(loadEntries());
    update();
    window.addEventListener("scout-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("scout-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  function handleClearAll() {
    if (!confirm("Delete ALL submissions? This cannot be undone.")) return;
    setEntries([]);
    saveEntries([]);
  }

  const filtered = [...entries]
    .sort((a, b) => Number(a.matchNumber) - Number(b.matchNumber))
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.teamNumber.includes(q) || e.matchNumber.includes(q) || e.scouter.toLowerCase().includes(q);
    });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
        <p className="text-sm text-slate-500">
          {entries.length} entr{entries.length !== 1 ? "ies" : "y"} saved
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400 font-medium">No submissions yet</p>
          <p className="text-sm text-slate-400 mt-1">Scout a match to get started</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              placeholder="Search by team, match, or scouter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="destructive" onClick={handleClearAll}>Clear All</Button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
              <p className="text-sm text-slate-400">No results for &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((e) => (
                <Row key={e.id} e={e} onDelete={() => handleDelete(e.id)} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="pb-4" />
    </main>
  );
}
