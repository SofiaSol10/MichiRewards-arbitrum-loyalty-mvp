"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { useReadContracts } from "wagmi";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export type OnchainReward = {
  id: bigint;
  merchant: Address;
  title: string;
  requiredLevel: number;
  costInPoints: bigint;
  stock: bigint;
  active: boolean;
};

function toOnchainReward(raw: {
  id: bigint;
  merchant: Address;
  title: string;
  requiredLevel: number;
  costInPoints: bigint;
  stock: bigint;
  active: boolean;
}): OnchainReward {
  return {
    id: raw.id,
    merchant: raw.merchant,
    title: raw.title,
    requiredLevel: Number(raw.requiredLevel),
    costInPoints: raw.costInPoints,
    stock: raw.stock,
    active: raw.active,
  };
}

/** Every address that was ever registered as a merchant (via constructor or registerMerchant). */
export function useRegisteredMerchants() {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { data: registeredEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "MerchantRegistered",
    watch: true,
  });

  return useMemo(() => {
    const set = new Set<Address>();
    registeredEvents?.forEach(evt => {
      if (evt.args.merchant) set.add(evt.args.merchant.toLowerCase() as Address);
    });
    return Array.from(set);
  }, [registeredEvents]);
}

/** Full catalog for a single merchant (used by the merchant's own "Gestión de Beneficios" panel). */
export function useMerchantRewards(merchantAddress?: Address) {
  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "MichiPoints" });

  const { data, isLoading, refetch } = useReadContracts({
    contracts:
      deployedContractData && merchantAddress
        ? [
            {
              address: deployedContractData.address,
              abi: deployedContractData.abi,
              functionName: "getRewardsByMerchant",
              args: [merchantAddress],
            },
          ]
        : [],
    query: { enabled: !!deployedContractData && !!merchantAddress },
  });

  const rewards = useMemo(() => {
    const result = data?.[0];
    if (!result || result.status !== "success") return [] as OnchainReward[];
    return (result.result as any[]).map(toOnchainReward);
  }, [data]);

  return { rewards, isLoading, refetch };
}

/** Aggregated active catalog across every registered merchant (used by the consumer marketplace). */
export function useAllRewards() {
  const merchantAddresses = useRegisteredMerchants();
  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "MichiPoints" });

  const { data, isLoading } = useReadContracts({
    contracts:
      deployedContractData && merchantAddresses.length > 0
        ? merchantAddresses.map(address => ({
            address: deployedContractData.address,
            abi: deployedContractData.abi,
            functionName: "getRewardsByMerchant",
            args: [address],
          }))
        : [],
    query: { enabled: !!deployedContractData && merchantAddresses.length > 0 },
  });

  const rewards = useMemo(() => {
    const list: OnchainReward[] = [];
    data?.forEach(result => {
      if (result.status !== "success") return;
      (result.result as unknown as any[]).forEach(raw => list.push(toOnchainReward(raw)));
    });
    return list.filter(r => r.active && r.stock > 0n);
  }, [data]);

  const byId = useMemo(() => new Map(rewards.map(r => [r.id.toString(), r])), [rewards]);

  return { rewards, byId, isLoading };
}

/** Write actions for a merchant managing its own reward catalog. */
export function useRewardCatalogActions() {
  const { writeContractAsync, isPending } = useScaffoldWriteContract({ contractName: "MichiPoints" });

  const createReward = (title: string, requiredLevel: number, costInPoints: bigint, stock: bigint) =>
    writeContractAsync({ functionName: "createReward", args: [title, requiredLevel, costInPoints, stock] });

  const setRewardActive = (rewardId: bigint, active: boolean) =>
    writeContractAsync({ functionName: "setRewardActive", args: [rewardId, active] });

  const restock = (rewardId: bigint, amount: bigint) =>
    writeContractAsync({ functionName: "restock", args: [rewardId, amount] });

  return { createReward, setRewardActive, restock, isPending };
}
