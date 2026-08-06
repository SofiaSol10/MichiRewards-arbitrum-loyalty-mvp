"use client";

import { useCallback, useEffect, useState } from "react";
import type { Offer } from "./useConsumerOffers";

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

const TICKET_TTL_MS = 15 * 60 * 1000;

const storageKey = (address?: string) => `michi:tickets:${address?.toLowerCase() ?? "anon"}`;

function generateCode() {
  const alphanum = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphanum[Math.floor(Math.random() * alphanum.length)]).join("");
  return `MCH-${pick(4)}-${pick(1)}`;
}

export function getTicketStatus(ticket: Ticket, now = Date.now()): TicketStatus {
  if (ticket.usedAt) return "redeemed";
  if (now > ticket.expiresAt) return "expired";
  return "active";
}

/**
 * Redemption tickets, persisted in localStorage per consumer address. There
 * is no on-chain redemption/coupon primitive for consumers yet
 * (MichiPoints.burnRewardToken is onlyMerchant), so "Canjear ahora" just
 * creates a ticket here instead of sending a transaction.
 */
export function useConsumerTickets(address?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!address) {
      setTickets([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(address));
      if (raw) {
        setTickets(JSON.parse(raw));
      } else {
        const seeded = seedDemoTickets();
        setTickets(seeded);
        localStorage.setItem(storageKey(address), JSON.stringify(seeded));
      }
    } catch {
      setTickets([]);
    }
  }, [address]);

  const persist = useCallback(
    (next: Ticket[]) => {
      setTickets(next);
      if (address) localStorage.setItem(storageKey(address), JSON.stringify(next));
    },
    [address],
  );

  const createTicket = useCallback(
    (offer: Offer) => {
      const now = Date.now();
      const ticket: Ticket = {
        id: crypto.randomUUID(),
        code: generateCode(),
        offerId: offer.id,
        merchantName: offer.merchantName,
        offerTitle: offer.title,
        costMP: offer.costMP,
        createdAt: now,
        expiresAt: now + TICKET_TTL_MS,
      };
      persist([ticket, ...tickets]);
      return ticket;
    },
    [tickets, persist],
  );

  const byStatus = (status: TicketStatus) => tickets.filter(t => getTicketStatus(t) === status);

  return { tickets, createTicket, byStatus };
}

function seedDemoTickets(): Ticket[] {
  const now = Date.now();
  const hours = (n: number) => n * 60 * 60 * 1000;
  const days = (n: number) => n * 24 * 60 * 60 * 1000;

  return [
    {
      id: crypto.randomUUID(),
      code: "MCH-8X92-A",
      offerId: "el-gato-barista",
      merchantName: "El Gato Barista",
      offerTitle: "Combo Desayuno",
      costMP: 25,
      createdAt: now - 1000 * 60 * 2,
      expiresAt: now - 1000 * 60 * 2 + TICKET_TTL_MS,
    },
    {
      id: crypto.randomUUID(),
      code: "SPA-991B-Z",
      offerId: "zen-spa",
      merchantName: "Zen Spa & Relax",
      offerTitle: "Cupón 15% Cashback",
      costMP: null,
      createdAt: now - 1000 * 60 * 8,
      expiresAt: now - 1000 * 60 * 8 + TICKET_TTL_MS,
    },
    ...Array.from({ length: 5 }, (_, i) => ({
      id: crypto.randomUUID(),
      code: generateCode(),
      offerId: "trattoria-del-michi",
      merchantName: i % 2 === 0 ? "La Trattoria del Michi" : "Café Central",
      offerTitle: "Canje anterior",
      costMP: i % 2 === 0 ? 150 : null,
      createdAt: now - days(i + 1),
      expiresAt: now - days(i + 1) + TICKET_TTL_MS,
      usedAt: now - days(i + 1) + 1000 * 60 * 5,
    })),
    {
      id: crypto.randomUUID(),
      code: generateCode(),
      offerId: "sweet-pastry-club",
      merchantName: "Sweet Pastry Club",
      offerTitle: "Cupón 20% Cashback",
      costMP: null,
      createdAt: now - days(3),
      expiresAt: now - days(3) + TICKET_TTL_MS,
    },
  ];
}
