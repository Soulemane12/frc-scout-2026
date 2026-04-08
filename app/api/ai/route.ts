import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { fetchAllMatchEntries, fetchAllPitEntries } from "@/app/lib/storage";
import { ScoutingEntry, PitEntry, totalFuel, climbPts, avg, pct } from "@/app/lib/types";

function buildMatchStats(entries: ScoutingEntry[]): string {
  const byTeam = new Map<string, ScoutingEntry[]>();
  for (const e of entries) {
    if (!byTeam.has(e.teamNumber)) byTeam.set(e.teamNumber, []);
    byTeam.get(e.teamNumber)!.push(e);
  }
  const header = "team|matches|avgFuel|avgCycles|avgClimbPts|winRate%|climbRate%|disableRate%";
  const rows = [...byTeam.entries()].map(([team, es]) => {
    const n = es.length;
    const wins = es.filter(e => e.allianceWinner === e.allianceColor).length;
    const climbs = es.filter(e => e.teleopClimb !== "no" && e.teleopClimb !== "").length;
    const disabled = es.filter(e => e.robotDisabled === "yes").length;
    return [
      team, n,
      avg(es.map(totalFuel)).toFixed(1),
      avg(es.map(e => e.cycles)).toFixed(1),
      avg(es.map(climbPts)).toFixed(1),
      pct(wins, n),
      pct(climbs, n),
      pct(disabled, n),
    ].join("|");
  });
  return [header, ...rows].join("\n");
}

function buildMatchRaw(entries: ScoutingEntry[]): string {
  const header = "id|match|team|alliance|autoCyc|autoYPC|autoMob|autoClimb|cyc|yellowPC|climb|winner|disabled|ycCard";
  const rows = entries.map(e => [
    e.id, e.matchNumber, e.teamNumber, e.allianceColor,
    e.autoCycles, e.autoYellowPerCycle, e.autoMobility, e.autoClimb,
    e.cycles, e.yellowPerCycle, e.teleopClimb,
    e.allianceWinner, e.robotDisabled, e.yellowCard,
  ].join("|"));
  return [header, ...rows].join("\n");
}

function buildPitStats(entries: PitEntry[]): string {
  const header = "team|drivetrain|maxClimb|climbConsistency|autoConsistency|estPoints|shootsMoving|vision";
  const rows = entries.map(e => [
    e.teamNumber, e.drivetrainType, e.maxClimb, e.climbConsistency,
    e.autoConsistency, e.estimatedPoints, e.shootsWhileMoving, e.usesVision,
  ].join("|"));
  return [header, ...rows].join("\n");
}

function buildPitRaw(entries: PitEntry[]): string {
  const header = "id|team|drivetrain|maxClimb|climbConsist|autoActions|autoConsist|fuelCollect|shootRange|cyclesEst|shootsMoving|estPts|vision";
  const rows = entries.map(e => [
    e.id, e.teamNumber, e.drivetrainType, e.maxClimb, e.climbConsistency,
    e.autoActions.join(","), e.autoConsistency,
    e.fuelCollection.join(","), e.shootRange.join(","),
    e.cyclesEstimate, e.shootsWhileMoving, e.estimatedPoints, e.usesVision,
  ].join("|"));
  return [header, ...rows].join("\n");
}

function buildSystemPrompt(matchEntries: ScoutingEntry[], pitEntries: PitEntry[]): string {
  return `You are an expert FRC scouting analyst for the NYC FRC Scout 2026 app (game: REBUILT).

GAME CONTEXT:
- Teams score FUEL (yellow balls) into HUBS during autonomous and teleop phases
- Climb levels: none (0pts), L1 (10pts), L2 (20pts), L3 (30pts)
- Alliances are Blue or Red
- Auto: preload fuel, cycle, cross bump/trench (autoMobility=yes), optional L1 climb
- Teleop/Stage: fuel cycles (cyc × yellowPC = fuel scored), hub inactive adaptation
- Hub adaptation options: defense, collect, cross, ferry, wait
- Thrower rating: 1-5 (quality of alliance human player throw)
- Win = allianceWinner matches allianceColor

MATCH STATS (aggregated per team, ${matchEntries.length} total entries):
${buildMatchStats(matchEntries)}

RAW MATCH ENTRIES:
${buildMatchRaw(matchEntries)}

PIT SCOUTING STATS (one row per team, ${pitEntries.length} teams):
${buildPitStats(pitEntries)}

RAW PIT ENTRIES:
${buildPitRaw(pitEntries)}

INSTRUCTIONS:
- Answer questions based ONLY on the data above
- Be specific: cite team numbers, match numbers, and stats
- If data is insufficient, say so honestly
- Give strategic FRC advice when asked about picks, alliance selection, or strategy
- ALWAYS end your response with this exact proof block (no exceptions):
<proof>{"matchIds":["id1","id2"],"pitIds":["id3"]}</proof>
- Use the actual entry IDs from the data above for entries you referenced
- Use empty arrays if no specific entries apply: <proof>{"matchIds":[],"pitIds":[]}</proof>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };
    const { message, history } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const [matchEntries, pitEntries] = await Promise.all([
      fetchAllMatchEntries(),
      fetchAllPitEntries(),
    ]);

    const systemPrompt = buildSystemPrompt(matchEntries, pitEntries);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Extract proof block
    const proofMatch = raw.match(/<proof>([\s\S]*?)<\/proof>/);
    let matchIds: string[] = [];
    let pitIds: string[] = [];
    if (proofMatch) {
      try {
        const parsed = JSON.parse(proofMatch[1].trim());
        matchIds = Array.isArray(parsed.matchIds) ? parsed.matchIds : [];
        pitIds = Array.isArray(parsed.pitIds) ? parsed.pitIds : [];
      } catch {
        // malformed proof block — no proof
      }
    }

    const answer = raw.replace(/<proof>[\s\S]*?<\/proof>/g, "").trim();

    // Look up referenced entries by ID
    const matchById = new Map(matchEntries.map(e => [e.id, e]));
    const pitById = new Map(pitEntries.map(e => [e.id, e]));

    const matchProof = matchIds
      .map(id => matchById.get(id))
      .filter((e): e is ScoutingEntry => e !== undefined);
    const pitProof = pitIds
      .map(id => pitById.get(id))
      .filter((e): e is PitEntry => e !== undefined);

    return NextResponse.json({ answer, matchProof, pitProof });
  } catch (err) {
    console.error("[AI route error]", err);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
