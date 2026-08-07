"use client";

import { useMemo } from "react";
import type { OnchainReward } from "./useOnchainRewards";
import { decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export type TicketStatus = "active" | "redeemed" | "expired";

export type Ticket = {
  id: string;
  code: string;
  offerId: string;
  merchantName: string;
  offerTitle: string;
  costMP: number | null;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
};

export const TICKET_TTL_MS = 15 * 60 * 1000;

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getTicketStatus(ticket: Ticket, now = Date.now()): TicketStatus {
  if (ticket.usedAt) return "redeemed";
  if (now > ticket.expiresAt) return "expired";
  return "active";
}

/**
 * Real redemption tickets, sourced from `TicketGenerated`/`TicketValidated` on-chain
 * events (there is now a real on-chain redemption primitive, `redeemReward` +
 * `validateTicket`, so nothing here is persisted locally anymore).
 */
export function useConsumerTickets(address?: string) {
  const { data: generatedEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "TicketGenerated",
    watch: true,
    fromBlock: 0n,
  });
  const { data: validatedEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "TicketValidated",
    watch: true,
    fromBlock: 0n,
  });

  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "MichiPoints" });
  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "MichiPoints" });
  const publicClient = usePublicClient();

  const redeemedIds = useMemo(
    () => new Set((validatedEvents ?? []).map(evt => evt.args.ticketId?.toLowerCase())),
    [validatedEvents],
  );

  const tickets = useMemo((): Ticket[] => {
    return (generatedEvents ?? [])
      .filter(evt => evt.args.customer?.toLowerCase() === address?.toLowerCase())
      .map(evt => {
        const expiresAtMs = Number(evt.args.expiresAt ?? 0n) * 1000;
        const ticketId = evt.args.ticketId?.toLowerCase();
        return {
          id: evt.args.ticketId ?? "",
          code: evt.args.code ?? "",
          offerId: evt.args.rewardId?.toString() ?? "",
          merchantName: shortAddress(evt.args.merchant ?? ""),
          offerTitle: "Beneficio canjeado",
          costMP: evt.args.pointsSpent !== undefined ? Number(evt.args.pointsSpent) : null,
          createdAt: expiresAtMs - TICKET_TTL_MS,
          expiresAt: expiresAtMs,
          usedAt: ticketId && redeemedIds.has(ticketId) ? expiresAtMs : undefined,
        };
      })
      .reverse();
  }, [generatedEvents, address, redeemedIds]);

  const byStatus = (status: TicketStatus) => tickets.filter(t => getTicketStatus(t) === status);

  const redeem = async (offer: OnchainReward): Promise<Ticket> => {
    if (!deployedContractData || !publicClient) throw new Error("Contrato no disponible todavía");

    const hash = await writeContractAsync({ functionName: "redeemReward", args: [offer.id] });
    if (!hash) throw new Error("La transacción no se envió");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: deployedContractData.abi, data: log.data, topics: log.topics });
        if (decoded.eventName === "TicketGenerated") {
          const args = decoded.args as {
            ticketId: string;
            code: string;
            customer: string;
            merchant: string;
            rewardId: bigint;
            pointsSpent: bigint;
            expiresAt: bigint;
          };
          const expiresAtMs = Number(args.expiresAt) * 1000;
          return {
            id: args.ticketId,
            code: args.code,
            offerId: args.rewardId.toString(),
            merchantName: shortAddress(args.merchant),
            offerTitle: offer.title,
            costMP: Number(args.pointsSpent),
            createdAt: expiresAtMs - TICKET_TTL_MS,
            expiresAt: expiresAtMs,
          };
        }
      } catch {
        // Not a decodable MichiPoints log (or a different event) — skip it.
      }
    }
    throw new Error("No se encontró el evento TicketGenerated en el recibo de la transacción");
  };

  return { tickets, byStatus, redeem };
}
