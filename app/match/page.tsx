"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Input, Textarea, Label, ChoiceGroup, MultiChoiceGroup, Counter, SectionDivider,
} from "../components/ui";
import { loadEntries, saveEntries } from "../lib/storage";
import { totalFuel } from "../lib/types";
import type { ScoutingEntry } from "../lib/types";
import { cn } from "../lib/utils";

const CLIMB_LABEL: Record<string, string> = { no: "No climb", l1: "L1", l2: "L2", l3: "L3" };

function MatchRow({ e, onDelete }: { e: ScoutingEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const fuel = totalFuel(e);
  const won = e.allianceWinner === e.allianceColor;
  return (
    <div className={cn("rounded-xl border bg-white shadow-sm overflow-hidden", open && "shadow-md")}>
      <button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors" onClick={() => setOpen(!open)}>
        <span className={cn("flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white", e.allianceColor === "blue" ? "bg-blue-500" : "bg-red-500")}>
          {e.allianceColor?.toUpperCase() || "?"}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-900">Team {e.teamNumber}</span>
          <span className="ml-2 text-sm text-slate-400">Match {e.matchNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          <span className="font-medium text-slate-700">{fuel} fuel</span>
          <span className={cn("rounded-full px-2 py-0.5 font-semibold",
            e.teleopClimb === "l3" ? "bg-green-100 text-green-700" :
            e.teleopClimb === "l2" ? "bg-teal-100 text-teal-700" :
            e.teleopClimb === "l1" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
          )}>{CLIMB_LABEL[e.teleopClimb] ?? "—"}</span>
          {won && <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-700">W</span>}
          {e.robotDisabled === "yes" && <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-600">DQ</span>}
        </div>
        <span className="text-slate-300 text-sm ml-1">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Match Info</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
            {[["Scouter", e.scouter || "—"], ["Preloaded", e.preloaded || "—"], ["Alliance", e.allianceColor || "—"]].map(([k, v]) => (
              <div key={k as string}><p className="text-xs font-medium text-slate-400">{k}</p><p className="capitalize text-slate-800">{v}</p></div>
            ))}
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Auto</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
            {[["Cycles", e.autoCycles], ["Fuel / cycle", e.autoYellowPerCycle], ["Est. fuel", e.autoCycles * e.autoYellowPerCycle], ["Crossed trench", e.autoMobility || "—"], ["Climb (L1)", e.autoClimb || "—"]].map(([k, v]) => (
              <div key={k as string}><p className="text-xs font-medium text-slate-400">{k}</p><p className="capitalize text-slate-800">{String(v)}</p></div>
            ))}
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Teleop</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
            {[["Cycles", e.cycles], ["Fuel / cycle", e.yellowPerCycle], ["Est. fuel", e.cycles * e.yellowPerCycle], ["Inactive hub", e.inactiveHubBehavior?.length ? e.inactiveHubBehavior.join(", ") : "—"]].map(([k, v]) => (
              <div key={k as string}><p className="text-xs font-medium text-slate-400">{k}</p><p className="capitalize text-slate-800">{String(v)}</p></div>
            ))}
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Endgame</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
            {[["Climb", CLIMB_LABEL[e.teleopClimb] ?? "—"], ["Stayed on", e.stayOn || "—"], ["Disabled", e.robotDisabled || "—"], ["Winner", e.allianceWinner || "—"], ["Yellow card", e.yellowCard || "—"]].map(([k, v]) => (
              <div key={k as string}><p className="text-xs font-medium text-slate-400">{k}</p><p className="capitalize text-slate-800">{String(v)}</p></div>
            ))}
          </div>
          {(e.defense || e.strengths || e.weaknesses || e.lossReason) && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg bg-slate-50 p-3 text-sm">
              {e.defense && <p><span className="font-semibold text-slate-500">Defense: </span><span className="text-slate-700">{e.defense}</span></p>}
              {e.strengths && <p><span className="font-semibold text-slate-500">Strengths: </span><span className="text-slate-700">{e.strengths}</span></p>}
              {e.weaknesses && <p><span className="font-semibold text-slate-500">Weaknesses: </span><span className="text-slate-700">{e.weaknesses}</span></p>}
              {e.lossReason && <p><span className="font-semibold text-red-500">Loss reason: </span><span className="text-slate-700">{e.lossReason}</span></p>}
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

const BLANK = {
  scouter: "",
  matchNumber: "",
  teamNumber: "",
  allianceColor: "",
  startingPosition: "",
  preloaded: "",
  autoCycles: 0,
  autoYellowPerCycle: 0,
  autoMobility: "",
  autoClimb: "",
  cycles: 0,
  yellowPerCycle: 0,
  inactiveHubBehavior: [] as string[],
  teleopClimb: "",
  stayOn: "",
  hpDirectScore: "",
  throwerRating: 0,
  robotDisabled: "",
  allianceWinner: "",
  yellowCard: "",
  defense: "",
  strengths: "",
  weaknesses: "",
  lossReason: "",
};

export default function FormPage() {
  const router = useRouter();
  const [f, setF] = useState(BLANK);
  const [submitted, setSubmitted] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
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

  function set<K extends keyof typeof BLANK>(key: K, val: (typeof BLANK)[K]) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  const estimatedTeleopFuel = f.cycles * f.yellowPerCycle;

  function handleSubmit() {
    if (!f.teamNumber || !f.matchNumber) {
      alert("Please fill in Match Number and Team Number before submitting.");
      return;
    }
    const entry: ScoutingEntry = { ...f, id: crypto.randomUUID(), timestamp: Date.now() };
    saveEntries([entry, ...loadEntries()]);
    setF(BLANK);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">

      {/* Success banner */}
      {submitted && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-800">
            <span className="text-base">✓</span> Entry saved successfully!
          </div>
          <button
            onClick={() => router.push("/submissions")}
            className="text-sm font-semibold text-green-700 underline underline-offset-2 hover:text-green-900"
          >
            View →
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="pb-1">
        <h1 className="text-2xl font-bold text-slate-900">Match Scouting</h1>
        <p className="text-sm text-slate-500">NYC Regional · REBUILT 2026</p>
      </div>

      {/* ── Field Reference ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setRefOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        >
          <span className="text-sm font-semibold text-slate-800">Field Reference</span>
          <span className="text-slate-400 text-sm">{refOpen ? "▲ Hide" : "▼ Show"}</span>
        </button>
        {refOpen && (
          <div className="flex flex-col gap-3 px-5 pb-5">
            <Image
              src="/scouting-ref-1.avif"
              alt="Scouting reference diagram 1"
              width={640}
              height={400}
              className="w-full rounded-lg border border-slate-100 object-contain"
            />
            <Image
              src="/scouting-ref-2.avif"
              alt="Scouting reference diagram 2"
              width={640}
              height={400}
              className="w-full rounded-lg border border-slate-100 object-contain"
            />
          </div>
        )}
      </div>

      {/* ── Match Info ── */}
      <Card>
        <CardHeader>
          <CardTitle>Match Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Match Number</Label>
              <Input
                type="number"
                placeholder="e.g. 23"
                value={f.matchNumber}
                onChange={(e) => set("matchNumber", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Team Number</Label>
              <Input
                type="number"
                placeholder="e.g. 4571"
                value={f.teamNumber}
                onChange={(e) => set("teamNumber", e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Scouter Name</Label>
              <Input
                type="text"
                placeholder="First and last name"
                value={f.scouter}
                onChange={(e) => set("scouter", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ChoiceGroup
        label="Alliance Color"
        options={[
          { label: "Blue Alliance", value: "blue" },
          { label: "Red Alliance", value: "red" },
        ]}
        value={f.allianceColor}
        onChange={(v) => set("allianceColor", v)}
      />

      
      {/* ── AUTO ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Auto</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      

      <ChoiceGroup
        label="Preloaded?"
        hint="Did the robot start the match with fuel (yellow ball) loaded?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.preloaded}
        onChange={(v) => set("preloaded", v)}
      />

      <Counter
        label="Cycles"
        hint="Collect → shoot = 1 cycle"
        value={f.autoCycles}
        onChange={(v) => set("autoCycles", v)}
      />

      <Counter
        label="Fuel (Yellow Ball) Per Cycle"
        hint="Average balls scored per cycle"
        value={f.autoYellowPerCycle}
        onChange={(v) => set("autoYellowPerCycle", v)}
      />

      <ChoiceGroup
        label="Crossed Bump / Trench?"
        hint="Does it go to the neutral zone? (See Field Reference)"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.autoMobility}
        onChange={(v) => set("autoMobility", v)}
      />

      <ChoiceGroup
        label="Auto Climb (L1)?"
        hint="L1 auto climb = 15 pts · max 2 robots"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.autoClimb}
        onChange={(v) => set("autoClimb", v)}
      />

      {/* ── TELEOP ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Teleop / Stage</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <Counter
        label="Cycles"
        hint="Collect → shoot = 1 cycle"
        value={f.cycles}
        onChange={(v) => set("cycles", v)}
      />

      <Counter
        label="Fuel (Yellow Ball) Per Cycle"
        hint="Average balls scored per cycle"
        value={f.yellowPerCycle}
        onChange={(v) => set("yellowPerCycle", v)}
      />

      {/* Live fuel estimate */}
      {f.cycles > 0 && f.yellowPerCycle > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <span className="text-sm text-slate-600">
            Estimated teleop fuel (yellow ball):{" "}
            <span className="font-bold text-slate-900">{estimatedTeleopFuel} pts</span>
          </span>
          <div className="flex gap-2">
            {estimatedTeleopFuel >= 360 && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                SUPERCHARGED RP
              </span>
            )}
            {estimatedTeleopFuel >= 100 && estimatedTeleopFuel < 360 && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                ENERGIZED RP
              </span>
            )}
          </div>
        </div>
      )}

      <MultiChoiceGroup
        label="Inactive Hub Behavior"
        hint="What did they do when their hub was turned off? (select all that apply)"
        options={[
          { label: "Defense", value: "defense" },
          { label: "Collect fuel (yellow ball)", value: "collect" },
          { label: "Cross bump/trench", value: "cross" },
          { label: "Ferrying", value: "ferry" },
          { label: "Waited / nothing", value: "wait" },
        ]}
        value={f.inactiveHubBehavior}
        onChange={(v) => set("inactiveHubBehavior", v)}
      />

      <ChoiceGroup
        label="Endgame Climb"
        hint="Tower hang at end of match"
        options={[
          { label: "No climb", value: "no" },
          { label: "L1", value: "l1", sub: "10 pts" },
          { label: "L2", value: "l2", sub: "20 pts" },
          { label: "L3", value: "l3", sub: "30 pts" },
        ]}
        value={f.teleopClimb}
        onChange={(v) => set("teleopClimb", v)}
      />

      {["l1", "l2", "l3"].includes(f.teleopClimb) && (
        <ChoiceGroup
          label="Robot Stayed on Tower?"
          hint="Was the climb still attached at the buzzer?"
          options={[
            { label: "Yes, stayed on", value: "yes" },
            { label: "No, fell off", value: "no" },
          ]}
          value={f.stayOn}
          onChange={(v) => set("stayOn", v)}
        />
      )}

      {/* ── ENDING ── */}
      <SectionDivider title="Ending" />

      <ChoiceGroup
        label="Robot Disabled or Broke Down?"
        options={[
          { label: "No issues", value: "no" },
          { label: "Yes, disabled", value: "yes" },
        ]}
        value={f.robotDisabled}
        onChange={(v) => set("robotDisabled", v)}
      />

      <ChoiceGroup
        label="Alliance Winner"
        options={[
          { label: "Blue Alliance", value: "blue" },
          { label: "Red Alliance", value: "red" },
        ]}
        value={f.allianceWinner}
        onChange={(v) => set("allianceWinner", v)}
      />

      <ChoiceGroup
        label="Yellow Card?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.yellowCard}
        onChange={(v) => set("yellowCard", v)}
      />

      {/* Defense notes */}
      <Card>
        <CardHeader>
          <CardTitle>Defense / Strategy Notes</CardTitle>
          <CardDescription>Did they play defense, shoot onto opponent&apos;s side, or both?</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Played heavy defense in teleop..."
            value={f.defense}
            onChange={(e) => set("defense", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle>Strengths</CardTitle>
          <CardDescription>What did this team do well?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="e.g. Consistent high cycles, strong auto..."
            value={f.strengths}
            onChange={(e) => set("strengths", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weaknesses</CardTitle>
          <CardDescription>What did this team struggle with?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="e.g. Missed several climb attempts..."
            value={f.weaknesses}
            onChange={(e) => set("weaknesses", e.target.value)}
          />
        </CardContent>
      </Card>

      {f.allianceWinner && f.allianceColor && f.allianceWinner !== f.allianceColor && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Why Did the Alliance Lose?</CardTitle>
            <CardDescription>What caused the loss? (e.g. missed climbs, defense held them back, low fuel output)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="e.g. Alliance struggled to score enough fuel, opponent played effective defense..."
              value={f.lossReason}
              onChange={(e) => set("lossReason", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button
        size="lg"
        onClick={handleSubmit}
        className="w-full rounded-xl shadow-md"
      >
        Submit Scouting Entry
      </Button>

      {/* ── My Submissions ── */}
      {entries.length > 0 && (
        <>
          <div className="flex items-center gap-3 py-1 mt-2">
            <div className="h-px flex-1 bg-slate-300" />
            <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">My Submissions ({entries.length})</span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>
          <Input
            placeholder="Search by team, match, or scouter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            {[...entries]
              .sort((a, b) => Number(a.matchNumber) - Number(b.matchNumber))
              .filter((e) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return e.teamNumber.includes(q) || e.matchNumber.includes(q) || e.scouter.toLowerCase().includes(q);
              })
              .map((e) => (
                <MatchRow
                  key={e.id}
                  e={e}
                  onDelete={() => {
                    if (!confirm("Delete this entry?")) return;
                    const next = entries.filter((x) => x.id !== e.id);
                    setEntries(next);
                    saveEntries(next);
                  }}
                />
              ))}
          </div>
        </>
      )}

      <div className="pb-4" />
    </main>
  );
}
