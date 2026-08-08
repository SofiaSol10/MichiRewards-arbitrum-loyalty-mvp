import { MERCHANT_LEVELS, merchantLevelFromExperience } from "./merchantLevels";

/**
 * Merchant-facing level, derived from the on-chain `merchantExperience`,
 * matching `getMerchantLevel` in MichiPoints.sol exactly.
 */
export function useMerchantLevel(merchantExperience: number) {
  const currentLevel = merchantLevelFromExperience(merchantExperience);
  const nextLevel = MERCHANT_LEVELS.find(l => l.xpRequired > currentLevel.xpRequired);

  const safeXp = Number.isFinite(merchantExperience) ? merchantExperience : 0;
  const xpToNext = nextLevel ? Math.max(0, nextLevel.xpRequired - safeXp) : 0;
  const progressPct = nextLevel
    ? Math.min(
        100,
        Math.max(0, ((safeXp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100),
      )
    : 100;

  return { currentLevel, nextLevel, progressPct, xpToNext };
}
