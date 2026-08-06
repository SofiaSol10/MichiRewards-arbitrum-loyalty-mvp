"use client";

import { useState } from "react";
import Link from "next/link";
import { Coffee, Plus, Sparkles, Store, Ticket as TicketIcon, Utensils } from "lucide-react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ConsumerHeader } from "~~/components/michi/ConsumerHeader";
import { TicketCodeModal } from "~~/components/michi/TicketCodeModal";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { MOCK_OFFERS, type Ticket, type TicketStatus, getTicketStatus, useConsumerTickets } from "~~/hooks/michi";

const TABS: { status: TicketStatus; label: string }[] = [
  { status: "active", label: "Activos / Por Usar" },
  { status: "redeemed", label: "Canjeados" },
  { status: "expired", label: "Expirados" },
];

const CATEGORY_ICONS = { coffee: Coffee, utensils: Utensils, sparkles: Sparkles, store: Store } as const;

function formatRelative(timestampMs: number) {
  const diffMs = Date.now() - timestampMs;
  const minutes = Math.round(diffMs / (60 * 1000));
  if (minutes < 1) return "Justo ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

function TicketRow({ ticket, onShowCode }: { ticket: Ticket; onShowCode: (ticket: Ticket) => void }) {
  const status = getTicketStatus(ticket);
  const offer = MOCK_OFFERS.find(o => o.id === ticket.offerId);
  const Icon = offer ? CATEGORY_ICONS[offer.icon] : TicketIcon;

  return (
    <div className="card flex-row items-center gap-3 border border-base-300 bg-base-100 p-3 shadow-sm sm:p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/80 to-accent/80 text-primary-content">
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {status === "active" && <span className="badge badge-success badge-sm">Listo para usar</span>}
          {status === "redeemed" && <span className="badge badge-outline badge-sm">Canjeado</span>}
          {status === "expired" && <span className="badge badge-error badge-outline badge-sm">Expirado</span>}
          <span className="text-xs text-base-content/50">
            {status === "redeemed" && ticket.usedAt
              ? `Canjeado ${formatRelative(ticket.usedAt).toLowerCase()}`
              : formatRelative(ticket.createdAt)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold">{ticket.offerTitle}</p>
        <p className="text-xs text-base-content/60">
          {ticket.merchantName}
          {ticket.costMP !== null && <> · {ticket.costMP} MP</>}
        </p>
        <p className="text-xs text-base-content/40">Cod: {ticket.code}</p>
      </div>

      <button type="button" className="btn btn-sm shrink-0" onClick={() => onShowCode(ticket)}>
        {status === "active" ? "Mostrar Código" : "Ver Código"}
      </button>
    </div>
  );
}

const TicketsPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { tickets, byStatus } = useConsumerTickets(connectedAddress);
  const [activeTab, setActiveTab] = useState<TicketStatus>("active");
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base-200 px-4">
        <div className="card max-w-sm bg-base-100 p-6 text-center shadow-xl">
          <p className="mb-4 text-sm text-base-content/70">Conecta tu wallet para ver tus tickets y canjes.</p>
          <div className="flex justify-center">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    );
  }

  const visibleTickets = byStatus(activeTab);

  return (
    <div className="min-h-dvh bg-base-200">
      <ConsumerHeader />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <TicketIcon className="size-3.5" aria-hidden="true" /> Mi billetera de cupones
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-[1.75rem]">Mis Tickets y Canjes 🎟️</h1>
            <p className="mt-1 text-sm text-base-content/70">
              Accede rápidamente a tus códigos de autorización para canjear en tienda o revisar tu historial on-chain.
            </p>
          </div>
          <Link href="/consumidor/beneficios" className="btn btn-primary gap-2">
            <Plus className="size-4" aria-hidden="true" /> Canjear más Michis
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.status}
              type="button"
              className={`btn btn-sm ${activeTab === tab.status ? "btn-neutral" : "btn-ghost bg-base-100"}`}
              onClick={() => setActiveTab(tab.status)}
            >
              {tab.label}
              <span className="badge badge-sm">{byStatus(tab.status).length}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {visibleTickets.length === 0 ? (
            <p className="card border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/50">
              No tienes tickets en esta categoría todavía.
            </p>
          ) : (
            visibleTickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} onShowCode={setViewingTicket} />)
          )}
        </div>

        {tickets.length === 0 && (
          <p className="mt-2 text-center text-xs text-base-content/40">
            Aún no tienes canjes — visita Michi Beneficios para empezar.
          </p>
        )}
      </main>

      {viewingTicket && <TicketCodeModal ticket={viewingTicket} onClose={() => setViewingTicket(null)} />}
    </div>
  );
};

export default TicketsPage;
