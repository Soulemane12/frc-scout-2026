"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Input, Textarea, Label, ChoiceGroup, MultiChoiceGroup, Counter, SectionDivider,
} from "../components/ui";
import { loadEntries, saveEntries } from "../lib/storage";
import type { ScoutingEntry } from "../lib/types";

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
};

export default function FormPage() {
  const router = useRouter();
  const [f, setF] = useState(BLANK);
  const [submitted, setSubmitted] = useState(false);

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

      <ChoiceGroup
        label="Starting Position"
        hint="Where on the field did the robot start?"
        options={[
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ]}
        cols={3}
        value={f.startingPosition}
        onChange={(v) => set("startingPosition", v)}
      />

      {/* ── AUTO ── */}
      <SectionDivider title="Auto" />

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
        hint="Does it go to the neutral zone?"
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
      <SectionDivider title="Teleop / Stage" />

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

      {/* Submit */}
      <Button
        size="lg"
        onClick={handleSubmit}
        className="w-full rounded-xl shadow-md"
      >
        Submit Scouting Entry
      </Button>

      <div className="pb-4" />
    </main>
  );
}
