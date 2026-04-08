import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { fetchAllMatchEntries, fetchAllPitEntries } from "@/app/lib/storage";
import { ScoutingEntry, PitEntry, totalFuel, climbPts, avg, pct } from "@/app/lib/types";

const MAX_FOCUSED_TEAMS = 12;
const MAX_MATCH_EVIDENCE = 60;
const MAX_PIT_EVIDENCE = 20;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 1000;

function truncate(value: string, maxChars: number) {
  return value.length > maxChars ? `${value.slice(0, maxChars)}...` : value;
}

function extractTeamNumbers(text: string) {
  return new Set(text.match(/\b\d{2,5}\b/g) ?? []);
}

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

function questionIntent(question: string) {
  const q = question.toLowerCase();
  return {
    avoid: /\b(avoid|bad|worst|risk|risky|weak|weakness|disabled|card)\b/.test(q),
    auto: /\b(auto|autonomous|mobility)\b/.test(q),
    climb: /\b(climb|climber|hang|stage)\b/.test(q),
    fuel: /\b(fuel|score|scoring|cycle|cycles|hub)\b/.test(q),
  };
}

function rankTeamEntries(question: string, entries: ScoutingEntry[]) {
  const intent = questionIntent(question);
  const byTeam = new Map<string, ScoutingEntry[]>();
  for (const e of entries) {
    if (!byTeam.has(e.teamNumber)) byTeam.set(e.teamNumber, []);
    byTeam.get(e.teamNumber)!.push(e);
  }

  return [...byTeam.entries()]
    .map(([team, es]) => {
      const n = es.length;
      const wins = es.filter(e => e.allianceWinner === e.allianceColor).length;
      const climbs = es.filter(e => e.teleopClimb !== "no" && e.teleopClimb !== "").length;
      const disabled = es.filter(e => e.robotDisabled === "yes").length;
      const yellowCards = es.filter(e => e.yellowCard === "yes").length;
      const autoMobility = es.filter(e => e.autoMobility === "yes").length;

      const avgFuel = avg(es.map(totalFuel));
      const avgClimb = avg(es.map(climbPts));
      const avgAutoFuel = avg(es.map(e => e.autoCycles * e.autoYellowPerCycle));
      const avgCycles = avg(es.map(e => e.cycles));
      const winRate = wins / n;
      const climbRate = climbs / n;
      const disabledRate = disabled / n;
      const yellowCardRate = yellowCards / n;
      const autoMobilityRate = autoMobility / n;

      let score = avgFuel + avgClimb * 1.5 + winRate * 10 - disabledRate * 20 - yellowCardRate * 10;
      if (intent.fuel) score = avgFuel * 2 + avgCycles;
      if (intent.climb) score = avgClimb * 3 + climbRate * 25 + avgFuel * 0.2;
      if (intent.auto) score = avgAutoFuel * 3 + autoMobilityRate * 15 + avgFuel * 0.2;
      if (intent.avoid) score = disabledRate * 60 + yellowCardRate * 30 - avgFuel - avgClimb;

      return { team, score };
    })
    .sort((a, b) => b.score - a.score);
}

function scoreMatchEntry(question: string, entry: ScoutingEntry) {
  const intent = questionIntent(question);
  let score = totalFuel(entry) + climbPts(entry) * 1.5;
  if (intent.fuel) score = totalFuel(entry) * 2 + entry.cycles;
  if (intent.climb) score = climbPts(entry) * 3 + totalFuel(entry) * 0.2;
  if (intent.auto) score = entry.autoCycles * entry.autoYellowPerCycle * 3 + (entry.autoMobility === "yes" ? 15 : 0);
  if (intent.avoid) score = (entry.robotDisabled === "yes" ? 60 : 0) + (entry.yellowCard === "yes" ? 30 : 0) - totalFuel(entry) - climbPts(entry);
  return score;
}

function selectEvidence(question: string, matchEntries: ScoutingEntry[], pitEntries: PitEntry[]) {
  const explicitTeams = extractTeamNumbers(question);
  const rankedTeams = rankTeamEntries(question, matchEntries).map(({ team }) => team);
  const focusTeams = explicitTeams.size
    ? [...explicitTeams]
    : rankedTeams.slice(0, MAX_FOCUSED_TEAMS);

  const byMatchTeam = new Map<string, ScoutingEntry[]>();
  for (const e of matchEntries) {
    if (!byMatchTeam.has(e.teamNumber)) byMatchTeam.set(e.teamNumber, []);
    byMatchTeam.get(e.teamNumber)!.push(e);
  }

  const matchEvidence = focusTeams.flatMap(team => {
    const entries = byMatchTeam.get(team) ?? [];
    const perTeamLimit = explicitTeams.size ? 8 : 5;
    return [...entries]
      .sort((a, b) => scoreMatchEntry(question, b) - scoreMatchEntry(question, a))
      .slice(0, perTeamLimit);
  }).slice(0, MAX_MATCH_EVIDENCE);

  const pitByTeam = new Map(pitEntries.map(e => [e.teamNumber, e]));
  const pitEvidence = focusTeams
    .map(team => pitByTeam.get(team))
    .filter((entry): entry is PitEntry => entry !== undefined)
    .slice(0, MAX_PIT_EVIDENCE);

  return { focusTeams, matchEvidence, pitEvidence };
}

function buildSystemPrompt(question: string, matchEntries: ScoutingEntry[], pitEntries: PitEntry[]): string {
  const evidence = selectEvidence(question, matchEntries, pitEntries);

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

FOCUSED TEAMS FOR THIS QUESTION:
${evidence.focusTeams.join(", ") || "none"}

SELECTED RAW MATCH ENTRIES FOR PROOF (${evidence.matchEvidence.length} of ${matchEntries.length} entries):
${buildMatchRaw(evidence.matchEvidence)}

PIT SCOUTING STATS (one row per team, ${pitEntries.length} teams):
${buildPitStats(pitEntries)}

SELECTED RAW PIT ENTRIES FOR PROOF (${evidence.pitEvidence.length} of ${pitEntries.length} entries):
${buildPitRaw(evidence.pitEvidence)}

INSTRUCTIONS:
- Answer questions based ONLY on the data above
- Be specific: cite team numbers, match numbers, and stats
- If data is insufficient, say so honestly
- Give strategic FRC advice when asked about picks, alliance selection, or strategy
- Use the full aggregate stats to make broad team comparisons
- Use selected raw entries as representative proof records; do not invent entry IDs
- ALWAYS end your response with this exact proof block (no exceptions):
<proof>{"matchIds":["id1","id2"],"pitIds":["id3"]}</proof>
- Use the actual entry IDs from the data above for entries you referenced
- Use empty arrays if no specific entries apply: <proof>{"matchIds":[],"pitIds":[]}</proof>`;
}

function errorStatus(err: unknown) {
  if (typeof err !== "object" || err === null || !("status" in err)) return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };
    const { message, history } = body;
    const trimmedMessage = message?.trim();

    if (!trimmedMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error("[AI route error] Missing GROQ_API_KEY");
      return NextResponse.json(
        { error: "AI is not configured. Set GROQ_API_KEY in Vercel and redeploy." },
        { status: 503 },
      );
    }

    const [matchEntries, pitEntries] = await Promise.all([
      fetchAllMatchEntries(),
      fetchAllPitEntries(),
    ]);

    const systemPrompt = buildSystemPrompt(trimmedMessage, matchEntries, pitEntries);
    const boundedHistory = Array.isArray(history)
      ? history.slice(-MAX_HISTORY_MESSAGES).map(m => ({
          role: m.role,
          content: truncate(m.content, MAX_HISTORY_CHARS),
        }))
      : [];

    console.log("[AI route] prompt context", {
      matchEntries: matchEntries.length,
      pitEntries: pitEntries.length,
      promptChars: systemPrompt.length,
      historyMessages: boundedHistory.length,
    });

    const groq = new Groq({ apiKey: groqApiKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...boundedHistory,
        { role: "user", content: trimmedMessage },
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
    if (errorStatus(err) === 413) {
      return NextResponse.json(
        { error: "The AI request was too large. Try asking about fewer teams or a narrower metric." },
        { status: 413 },
      );
    }
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
