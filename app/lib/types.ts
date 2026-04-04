export interface ScoutingEntry {
  id: string;
  timestamp: number;
  scouter: string;
  matchNumber: string;
  teamNumber: string;
  allianceColor: string;
  startingPosition: string;
  preloaded: string;
  autoCycles: number;
  autoYellowPerCycle: number;
  autoMobility: string;
  autoClimb: string;
  cycles: number;
  yellowPerCycle: number;
  inactiveHubBehavior: string[];
  teleopClimb: string;
  stayOn: string;
  hpDirectScore: string;
  throwerRating: number;
  robotDisabled: string;
  allianceWinner: string;
  yellowCard: string;
  defense: string;
  strengths: string;
  weaknesses: string;
}

export interface PitEntry {
  id: string;
  timestamp: number;
  scouter: string;
  teamNumber: string;
  robotName: string;
  motors: string;
  drivetrainType: string;
  fitsUnderTrench: string;
  crossesBump: string;
  fuelCollection: string[];
  shootRange: string[];
  cyclesEstimate: number;
  shootsWhileMoving: string;
  hubAdaptation: string;
  scoreOpponentHub: string;
  autoActions: string[];
  autoConsistency: string;
  maxClimb: string;
  climbConsistency: string;
  usesVision: string;
  estimatedPoints: string;
  strengths: string;
  weaknesses: string;
  notes: string;
}

export function totalFuel(e: ScoutingEntry) {
  return e.autoCycles * e.autoYellowPerCycle + e.cycles * e.yellowPerCycle;
}

export function climbPts(e: ScoutingEntry) {
  if (e.teleopClimb === "l1") return 10;
  if (e.teleopClimb === "l2") return 20;
  if (e.teleopClimb === "l3") return 30;
  return 0;
}

export function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function pct(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}
