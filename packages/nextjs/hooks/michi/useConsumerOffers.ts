import { useMemo } from "react";
import { levelFromPoints } from "./michiLevels";
import { type OnchainReward, useAllRewards } from "./useOnchainRewards";

export type OfferCategory = "cafeteria" | "restaurante" | "servicio" | "tienda";

export type Offer = {
  id: string;
  merchantName: string;
  category: OfferCategory;
  icon: "coffee" | "utensils" | "sparkles" | "store";
  title: string;
  subtitle: string;
  badge: string;
  costMP: number | null;
  levelRequired: number;
  cta: string;
};

export const CATEGORY_LABELS: Record<"todos" | OfferCategory, string> = {
  todos: "Todos",
  cafeteria: "Cafeterías",
  restaurante: "Restaurantes",
  servicio: "Servicios",
  tienda: "Tiendas",
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Every real on-chain reward is shown as a generic "tienda" offer — the contract
 * doesn't store marketing metadata (category/merchant name/badge copy), only
 * title/cost/level/stock. */
export function toOffer(reward: OnchainReward): Offer {
  return {
    id: reward.id.toString(),
    merchantName: shortAddress(reward.merchant),
    category: "tienda",
    icon: "store",
    title: reward.title,
    subtitle: `Comercio ${shortAddress(reward.merchant)}`,
    badge: `Stock: ${reward.stock.toString()}`,
    costMP: Number(reward.costInPoints),
    levelRequired: reward.requiredLevel,
    cta: "Canjear ahora",
  };
}

/**
 * Real on-chain reward catalog aggregated across every registered merchant,
 * adapted to the `Offer` shape the consumer marketplace UI renders.
 */
export function useConsumerOffers(totalPointsEarned: number) {
  const { rewards, isLoading } = useAllRewards();
  const currentLevel = levelFromPoints(totalPointsEarned);

  const offers = useMemo(() => rewards.map(toOffer), [rewards]);

  const isUnlocked = (offer: Offer) => currentLevel.level >= offer.levelRequired;

  return { offers, isUnlocked, currentLevel, isLoading };
}
