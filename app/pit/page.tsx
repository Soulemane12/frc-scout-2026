"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Textarea, Label, ChoiceGroup, MultiChoiceGroup, Counter,
} from "../components/ui";
import { loadPitEntries, savePitEntries } from "../lib/storage";
import type { PitEntry } from "../lib/types";
import { cn } from "../lib/utils";

const CLIMB_LABEL_PIT: Record<string, string> = { none: "No climb", l1: "L1", l2: "L2", l3: "L3" };

function PitRow({ e, onDelete }: { e: PitEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-xl border bg-white shadow-sm overflow-hidden", open && "shadow-md")}>
      <button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-900">Team {e.teamNumber}</span>
          {e.robotName && <span className="ml-2 text-sm text-slate-400">{e.robotName}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 capitalize">{e.drivetrainType || "—"}</span>
          <span className={cn("rounded-full px-2 py-0.5 font-semibold",
            e.maxClimb === "l3" ? "bg-green-100 text-green-700" :
            e.maxClimb === "l2" ? "bg-teal-100 text-teal-700" :
            e.maxClimb === "l1" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
          )}>{CLIMB_LABEL_PIT[e.maxClimb] ?? "—"}</span>
        </div>
        <span className="text-slate-300 text-sm ml-1">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm mb-3">
            {[["Motors", e.motors || "—"], ["Drivetrain", e.drivetrainType || "—"], ["Fits trench", e.fitsUnderTrench || "—"], ["Crosses bump", e.crossesBump || "—"], ["Hub adaptation", e.hubAdaptation || "—"], ["Max climb", CLIMB_LABEL_PIT[e.maxClimb] ?? "—"], ["Uses vision", e.usesVision || "—"], ["Est. pts", e.estimatedPoints || "—"]].map(([k, v]) => (
              <div key={k as string}><p className="text-xs font-medium text-slate-400">{k}</p><p className="capitalize text-slate-800">{String(v)}</p></div>
            ))}
          </div>
          {(e.strengths || e.weaknesses || e.notes) && (
            <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 text-sm">
              {e.strengths && <p><span className="font-semibold text-slate-500">Strengths: </span><span className="text-slate-700">{e.strengths}</span></p>}
              {e.weaknesses && <p><span className="font-semibold text-slate-500">Weaknesses: </span><span className="text-slate-700">{e.weaknesses}</span></p>}
              {e.notes && <p><span className="font-semibold text-slate-500">Notes: </span><span className="text-slate-700">{e.notes}</span></p>}
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

const BLANK: Omit<PitEntry, "id" | "timestamp"> = {
  scouter: "",
  teamNumber: "",
  robotName: "",
  motors: "",
  drivetrainType: "",
  fitsUnderTrench: "",
  crossesBump: "",
  fuelCollection: [],
  shootRange: [],
  cyclesEstimate: 0,
  shootsWhileMoving: "",
  hubAdaptation: "",
  scoreOpponentHub: "",
  autoActions: [],
  autoConsistency: "",
  maxClimb: "",
  climbConsistency: "",
  usesVision: "",
  estimatedPoints: "",
  strengths: "",
  weaknesses: "",
  notes: "",
};

export default function PitPage() {
  const router = useRouter();
  const [f, setF] = useState(BLANK);
  const [submitted, setSubmitted] = useState(false);
  const [entries, setEntries] = useState<PitEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const update = () => setEntries(loadPitEntries());
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

  function handleSubmit() {
    if (!f.teamNumber) {
      alert("Please fill in a Team Number before submitting.");
      return;
    }
    const entry: PitEntry = { ...f, id: crypto.randomUUID(), timestamp: Date.now() };
    savePitEntries([entry, ...loadPitEntries()]);
    setF(BLANK);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">

      {submitted && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-800">
            <span className="text-base">✓</span> Pit entry saved!
          </div>
          <button
            onClick={() => router.push("/submissions")}
            className="text-sm font-semibold text-green-700 underline underline-offset-2 hover:text-green-900"
          >
            View →
          </button>
        </div>
      )}

      <div className="pb-1">
        <h1 className="text-2xl font-bold text-slate-900">Pit Scouting</h1>
        <p className="text-sm text-slate-500">NYC Regional · REBUILT 2026</p>
      </div>

      {/* ── Identity ── */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Team Number</Label>
              <Input
                type="number"
                placeholder="e.g. 4571"
                value={f.teamNumber}
                onChange={(e) => set("teamNumber", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Team Name</Label>
              <Input
                type="text"
                placeholder="e.g. Titan"
                value={f.robotName}
                onChange={(e) => set("robotName", e.target.value)}
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

      {/* ── Mechanical ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Mechanical</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <Card>
        <CardHeader><CardTitle>Motors</CardTitle></CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Kraken x60, Falcon 500..."
            value={f.motors}
            onChange={(e) => set("motors", e.target.value)}
          />
        </CardContent>
      </Card>

      <ChoiceGroup
        label="Drivetrain Type"
        options={[
          { label: "Swerve", value: "swerve" },
          { label: "Tank", value: "tank" },
          { label: "Mecanum", value: "mecanum" },
          { label: "Other", value: "other" },
        ]}
        cols={4}
        value={f.drivetrainType}
        onChange={(v) => set("drivetrainType", v)}
      />

      <ChoiceGroup
        label="Fits Under Trench?"
        hint="Can the robot drive under the trench without stopping?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.fitsUnderTrench}
        onChange={(v) => set("fitsUnderTrench", v)}
      />

      <ChoiceGroup
        label="Can Cross the Bump?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.crossesBump}
        onChange={(v) => set("crossesBump", v)}
      />

      {/* ── Fuel Scoring ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Fuel Scoring</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <MultiChoiceGroup
        label="Fuel Collection Method"
        hint="Where does the robot primarily collect fuel? (select all)"
        options={[
          { label: "Depot", value: "depot" },
          { label: "Floor pickup", value: "floor" },
          { label: "Human player pass", value: "hp-pass" },
        ]}
        cols={3}
        value={f.fuelCollection}
        onChange={(v) => set("fuelCollection", v)}
      />

      <MultiChoiceGroup
        label="Shooting Range"
        hint="Where does the robot shoot from? (select all)"
        options={[
          { label: "Close range", value: "close" },
          { label: "Mid range", value: "mid" },
          { label: "Far range", value: "far" },
        ]}
        cols={3}
        value={f.shootRange}
        onChange={(v) => set("shootRange", v)}
      />

      <Counter
        label="Estimated Cycles per Match"
        hint="How many full collect → shoot cycles?"
        value={f.cyclesEstimate}
        onChange={(v) => set("cyclesEstimate", v)}
      />

      <ChoiceGroup
        label="Shoots While Moving?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.shootsWhileMoving}
        onChange={(v) => set("shootsWhileMoving", v)}
      />

      {/* ── Hub Strategy ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Hub Strategy</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <ChoiceGroup
        label="Adapts When Hub Is Inactive?"
        hint="Does the robot change strategy when their hub turns off?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "Working on it", value: "wip" },
          { label: "No", value: "no" },
        ]}
        cols={3}
        value={f.hubAdaptation}
        onChange={(v) => set("hubAdaptation", v)}
      />

    {/*  <ChoiceGroup
        label="Can it score in hub?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.scoreOpponentHub}
        onChange={(v) => set("scoreOpponentHub", v)}
      />*
      
      /}

      

      {/* ── Auto ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Auto</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <MultiChoiceGroup
        label="Auto Actions"
        hint="What does the robot do in auto? (select all)"
        options={[
          { label: "Scores fuel", value: "fuel" },
          { label: "Climbs L1", value: "climb" },
          { label: "Crosses trench", value: "trench" },
          { label: "Just moves", value: "move" },
          { label: "Nothing", value: "nothing" },
        ]}
        value={f.autoActions}
        onChange={(v) => set("autoActions", v)}
      />

      <ChoiceGroup
        label="Auto Consistency"
        options={[
          { label: "Always", value: "always" },
          { label: "Usually", value: "usually" },
          { label: "Sometimes", value: "sometimes" },
          { label: "Never", value: "never" },
        ]}
        cols={4}
        value={f.autoConsistency}
        onChange={(v) => set("autoConsistency", v)}
      />

      {/* ── Endgame ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Endgame</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <ChoiceGroup
        label="Max Climb Level"
        options={[
          { label: "No climb", value: "none" },
          { label: "L1", value: "l1", sub: "10 pts" },
          { label: "L2", value: "l2", sub: "20 pts" },
          { label: "L3", value: "l3", sub: "30 pts" },
        ]}
        value={f.maxClimb}
        onChange={(v) => set("maxClimb", v)}
      />

      {["l1", "l2", "l3"].includes(f.maxClimb) && (
        <ChoiceGroup
          label="Climb Consistency"
          options={[
            { label: "Always", value: "always" },
            { label: "Usually", value: "usually" },
            { label: "Sometimes", value: "sometimes" },
            { label: "Never", value: "never" },
          ]}
          cols={4}
          value={f.climbConsistency}
          onChange={(v) => set("climbConsistency", v)}
        />
      )}

      {/* ── General ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">General</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <ChoiceGroup
        label="Uses Vision / AprilTags?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        value={f.usesVision}
        onChange={(v) => set("usesVision", v)}
      />

      <Card>
        <CardHeader><CardTitle>Estimated Points per Match</CardTitle></CardHeader>
        <CardContent>
          <Input
            type="number"
            placeholder="e.g. 80"
            value={f.estimatedPoints}
            onChange={(e) => set("estimatedPoints", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="What does this team do well?"
            value={f.strengths}
            onChange={(e) => set("strengths", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Weaknesses</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="What does this team struggle with?"
            value={f.weaknesses}
            onChange={(e) => set("weaknesses", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Anything relevant not covered above..."
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSubmit} className="w-full rounded-xl shadow-md">
        Submit Pit Entry
      </Button>

      {entries.length > 0 && (
        <>
          <div className="flex items-center gap-3 py-1 mt-2">
            <div className="h-px flex-1 bg-slate-300" />
            <span className="text-sm font-extrabold uppercase tracking-widest text-slate-700">My Pit Entries ({entries.length})</span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>
          <Input
            placeholder="Search by team or robot name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            {[...entries]
              .sort((a, b) => Number(a.teamNumber) - Number(b.teamNumber))
              .filter((e) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return e.teamNumber.includes(q) || e.robotName.toLowerCase().includes(q) || e.scouter.toLowerCase().includes(q);
              })
              .map((e) => (
                <PitRow
                  key={e.id}
                  e={e}
                  onDelete={() => {
                    if (!confirm("Delete this entry?")) return;
                    const next = entries.filter((x) => x.id !== e.id);
                    setEntries(next);
                    savePitEntries(next);
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
