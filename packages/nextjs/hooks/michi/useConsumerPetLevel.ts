export type PetLevel = {
  level: number;
  title: string;
  icon: string;
  mpRequired: number;
};

/**
 * Consumer-facing Michi pet levels. Distinct from the merchant BENEFIT_LEVELS
 * (different names/thresholds) — there is no on-chain concept of pet levels,
 * so this is a frontend-only mock derived from the MichiPoints balance.
 */
export const MICHI_PET_LEVELS: PetLevel[] = [
  { level: 1, title: "Michi Bebé", icon: "🍼", mpRequired: 0 },
  { level: 2, title: "Michi Explorador", icon: "🐾", mpRequired: 500 },
  { level: 3, title: "Michi Frecuente", icon: "😺", mpRequired: 2500 },
  { level: 4, title: "Michi Supremo", icon: "👑", mpRequired: 10000 },
  { level: 5, title: "Michi Cósmico", icon: "🚀", mpRequired: 50000 },
];

export function useConsumerPetLevel(balance: number) {
  const safeBalance = Number.isFinite(balance) ? balance : 0;

  const currentLevel = [...MICHI_PET_LEVELS].reverse().find(l => safeBalance >= l.mpRequired) ?? MICHI_PET_LEVELS[0];
  const nextLevel = MICHI_PET_LEVELS.find(l => l.mpRequired > currentLevel.mpRequired);

  const mpToNext = nextLevel ? Math.max(0, nextLevel.mpRequired - safeBalance) : 0;
  const progressPct = nextLevel
    ? Math.min(
        100,
        Math.max(0, ((safeBalance - currentLevel.mpRequired) / (nextLevel.mpRequired - currentLevel.mpRequired)) * 100),
      )
    : 100;

  return { currentLevel, nextLevel, progressPct, mpToNext };
}
