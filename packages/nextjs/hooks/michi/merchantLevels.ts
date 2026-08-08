export type MerchantLevel = {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  icon: string;
  xpRequired: number;
};

/**
 * Canonical merchant level table — mirrors `_merchantLevelOf` in `MichiPoints.sol` exactly
 * (thresholds and names). Based on the merchant's on-chain `merchantExperience`: 20% of the
 * points issued in purchases plus 100% of the points customers spend redeeming its rewards,
 * so a merchant levels up mainly by having benefits that actually get used.
 */
export const MERCHANT_LEVELS: MerchantLevel[] = [
  { level: 1, title: "Rincón Michi", icon: "🐾", xpRequired: 0 },
  { level: 2, title: "Refugio Michi", icon: "🏡", xpRequired: 100 },
  { level: 3, title: "Casa Michi Favorita", icon: "🐟", xpRequired: 300 },
  { level: 4, title: "Reino Michi", icon: "👑", xpRequired: 700 },
  { level: 5, title: "Santuario Michi", icon: "⭐", xpRequired: 1500 },
];

export function merchantLevelFromExperience(merchantExperience: number): MerchantLevel {
  const safeXp = Number.isFinite(merchantExperience) ? merchantExperience : 0;
  return [...MERCHANT_LEVELS].reverse().find(l => safeXp >= l.xpRequired) ?? MERCHANT_LEVELS[0];
}
