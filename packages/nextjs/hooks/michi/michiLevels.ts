export type MichiLevel = {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  icon: string;
  mpRequired: number;
};

/**
 * Canonical Michi level table — mirrors `_levelOf` in `MichiPoints.sol` exactly
 * (thresholds and names). Based on the customer's lifetime `totalPointsEarned`,
 * never on the spendable `balanceOf`, so redeeming a benefit never demotes a level.
 */
export const MICHI_LEVELS: MichiLevel[] = [
  { level: 1, title: "Michi Bebé", icon: "🍼", mpRequired: 0 },
  { level: 2, title: "Michi Explorador", icon: "🐾", mpRequired: 500 },
  { level: 3, title: "Michi Cazador Nocturno", icon: "🌙", mpRequired: 2500 },
  { level: 4, title: "Michi Supremo", icon: "👑", mpRequired: 5000 },
  { level: 5, title: "Michi Cósmico", icon: "🚀", mpRequired: 10000 },
];

export function levelFromPoints(totalPointsEarned: number): MichiLevel {
  const safePoints = Number.isFinite(totalPointsEarned) ? totalPointsEarned : 0;
  return [...MICHI_LEVELS].reverse().find(l => safePoints >= l.mpRequired) ?? MICHI_LEVELS[0];
}
