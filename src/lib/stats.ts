/**
 * Shared stat helpers used across dashboard, history, analytics.
 */

export interface GameStats {
  points: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  shots_made: number;
  shots_taken: number;
  minutes_played?: number | null;
}

export function fgPct(g: GameStats): number {
  if (!g.shots_taken) return 0;
  return (g.shots_made / g.shots_taken) * 100;
}

export function pointsPerShot(g: GameStats): number {
  if (!g.shots_taken) return 0;
  return g.points / g.shots_taken;
}

/** Simple efficiency: PTS + REB + STL + BLK − TO − missed shots */
export function efficiency(g: GameStats): number {
  const missed = Math.max(0, g.shots_taken - g.shots_made);
  return g.points + g.rebounds + g.steals + g.blocks - g.turnovers - missed;
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export interface AggregateStats {
  games: number;
  avgPoints: number;
  avgRebounds: number;
  avgSteals: number;
  avgBlocks: number;
  avgTurnovers: number;
  fgPct: number;
  pps: number;
  efficiency: number;
}

export function aggregate(games: GameStats[]): AggregateStats {
  const n = games.length;
  if (n === 0) {
    return {
      games: 0,
      avgPoints: 0,
      avgRebounds: 0,
      avgSteals: 0,
      avgBlocks: 0,
      avgTurnovers: 0,
      fgPct: 0,
      pps: 0,
      efficiency: 0,
    };
  }
  const totalShotsMade = games.reduce((s, g) => s + g.shots_made, 0);
  const totalShotsTaken = games.reduce((s, g) => s + g.shots_taken, 0);
  return {
    games: n,
    avgPoints: avg(games.map((g) => g.points)),
    avgRebounds: avg(games.map((g) => g.rebounds)),
    avgSteals: avg(games.map((g) => g.steals)),
    avgBlocks: avg(games.map((g) => g.blocks)),
    avgTurnovers: avg(games.map((g) => g.turnovers)),
    fgPct: totalShotsTaken ? (totalShotsMade / totalShotsTaken) * 100 : 0,
    pps: totalShotsTaken ? games.reduce((s, g) => s + g.points, 0) / totalShotsTaken : 0,
    efficiency: avg(games.map((g) => efficiency(g))),
  };
}

export const GAME_TYPES = [
  { value: "pickup", label: "Pickup" },
  { value: "open_run", label: "Open Run" },
  { value: "league", label: "League" },
  { value: "tournament", label: "Tournament" },
  { value: "scrimmage", label: "Scrimmage" },
] as const;

export function gameTypeLabel(value: string): string {
  return GAME_TYPES.find((t) => t.value === value)?.label ?? value;
}
