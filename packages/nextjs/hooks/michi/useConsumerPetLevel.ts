import { MICHI_LEVELS, type MichiLevel, levelFromPoints } from "./michiLevels";

export type { MichiLevel as PetLevel };
export { MICHI_LEVELS as MICHI_PET_LEVELS };

/**
 * Consumer-facing Michi pet level, derived from the on-chain `totalPointsEarned`
 * (lifetime points), matching `getMichiLevel` in MichiPoints.sol exactly.
 */
export function useConsumerPetLevel(totalPointsEarned: number) {
  const currentLevel = levelFromPoints(totalPointsEarned);
  const nextLevel = MICHI_LEVELS.find(l => l.mpRequired > currentLevel.mpRequired);

  const safePoints = Number.isFinite(totalPointsEarned) ? totalPointsEarned : 0;
  const mpToNext = nextLevel ? Math.max(0, nextLevel.mpRequired - safePoints) : 0;
  const progressPct = nextLevel
    ? Math.min(
        100,
        Math.max(0, ((safePoints - currentLevel.mpRequired) / (nextLevel.mpRequired - currentLevel.mpRequired)) * 100),
      )
    : 100;

  return { currentLevel, nextLevel, progressPct, mpToNext };
}
