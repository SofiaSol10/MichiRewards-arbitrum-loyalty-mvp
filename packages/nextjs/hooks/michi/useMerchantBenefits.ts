"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { MICHI_LEVELS } from "./michiLevels";
import { useMerchantRewards, useRewardCatalogActions } from "./useOnchainRewards";

export type BenefitLevel = 1 | 2 | 3 | 4 | 5;

export type Benefit = {
  id: string;
  level: BenefitLevel;
  name: string;
  cost: number;
  stock: number;
  active: boolean;
};

export const BENEFIT_LEVELS = MICHI_LEVELS.map(({ level, title, icon }) => ({ level, title, icon }));

export const MAX_SLOTS_PER_LEVEL = 5;

/**
 * Merchant's own reward catalog, backed on-chain by `createReward` / `setRewardActive` /
 * `restock`. Unlike the old localStorage mock, an existing reward's name/cost/level can't
 * be changed after creation — only whether it's active and how much stock it has.
 */
export function useMerchantBenefits(merchantAddress?: Address) {
  const { rewards, isLoading, refetch } = useMerchantRewards(merchantAddress);
  const { createReward, setRewardActive, restock, isPending } = useRewardCatalogActions();

  const benefits = useMemo<Benefit[]>(
    () =>
      rewards.map(r => ({
        id: r.id.toString(),
        level: r.requiredLevel as BenefitLevel,
        name: r.title,
        cost: Number(r.costInPoints),
        stock: Number(r.stock),
        active: r.active,
      })),
    [rewards],
  );

  const addBenefit = async (level: BenefitLevel, data: { name: string; cost: number; stock: number }) => {
    await createReward(data.name, level, BigInt(data.cost), BigInt(data.stock));
    await refetch();
  };

  const restockBenefit = async (id: string, amount: number) => {
    await restock(BigInt(id), BigInt(amount));
    await refetch();
  };

  const toggleBenefitActive = async (id: string, active: boolean) => {
    await setRewardActive(BigInt(id), active);
    await refetch();
  };

  return { benefits, addBenefit, restockBenefit, toggleBenefitActive, isLoading, isPending };
}
