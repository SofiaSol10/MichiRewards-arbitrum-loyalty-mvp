"use client";

import { useCallback, useEffect, useState } from "react";

export type BenefitLevel = 1 | 2 | 3 | 4 | 5;

export type Benefit = {
  id: string;
  level: BenefitLevel;
  name: string;
  cost: number;
  stockMax: number;
  stockCurrent: number;
};

export const BENEFIT_LEVELS: { level: BenefitLevel; title: string; icon: string }[] = [
  { level: 1, title: "Michi Bebé", icon: "🍼" },
  { level: 2, title: "Michi Explorador", icon: "🐾" },
  { level: 3, title: "Michi Cazador Nocturno", icon: "🌙" },
  { level: 4, title: "Michi Supremo", icon: "👑" },
  { level: 5, title: "Michi Cósmico", icon: "🚀" },
];

export const MAX_SLOTS_PER_LEVEL = 5;

const storageKey = (merchantAddress?: string) => `michi:benefits:${merchantAddress?.toLowerCase() ?? "anon"}`;

/**
 * Benefit catalog per merchant, persisted in localStorage. There is no
 * on-chain concept of levels/benefits yet, so this is a frontend-only mock.
 */
export function useMerchantBenefits(merchantAddress?: string) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);

  useEffect(() => {
    if (!merchantAddress) {
      setBenefits([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(merchantAddress));
      setBenefits(raw ? JSON.parse(raw) : []);
    } catch {
      setBenefits([]);
    }
  }, [merchantAddress]);

  const persist = useCallback(
    (next: Benefit[]) => {
      setBenefits(next);
      if (merchantAddress) localStorage.setItem(storageKey(merchantAddress), JSON.stringify(next));
    },
    [merchantAddress],
  );

  const addBenefit = useCallback(
    (level: BenefitLevel, data: { name: string; cost: number; stockMax: number }) => {
      const benefit: Benefit = {
        id: crypto.randomUUID(),
        level,
        name: data.name,
        cost: data.cost,
        stockMax: data.stockMax,
        stockCurrent: data.stockMax,
      };
      persist([...benefits, benefit]);
    },
    [benefits, persist],
  );

  const updateBenefit = useCallback(
    (id: string, data: Partial<Pick<Benefit, "name" | "cost" | "stockMax" | "stockCurrent">>) => {
      persist(benefits.map(b => (b.id === id ? { ...b, ...data } : b)));
    },
    [benefits, persist],
  );

  const removeBenefit = useCallback(
    (id: string) => {
      persist(benefits.filter(b => b.id !== id));
    },
    [benefits, persist],
  );

  return { benefits, addBenefit, updateBenefit, removeBenefit };
}
