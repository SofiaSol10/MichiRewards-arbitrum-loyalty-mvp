"use client";

import { useEffect, useState } from "react";
import { Cat, CheckCircle2, ExternalLink, X } from "lucide-react";
import { type Ticket, getTicketStatus } from "~~/hooks/michi";

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type TicketCodeModalProps = {
  ticket: Ticket;
  justRedeemed?: boolean;
  onClose: () => void;
};

export function TicketCodeModal({ ticket, justRedeemed, onClose }: TicketCodeModalProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const status = getTicketStatus(ticket, now);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm text-center">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Cat className="size-4" aria-hidden="true" /> Michi Rewards
          </p>
          <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={onClose}>
            <X className="size-4" /> Cerrar
          </button>
        </div>

        {justRedeemed && status === "active" && (
          <>
            <CheckCircle2 className="mx-auto mt-4 size-12 text-success" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold">¡Canje Exitoso!</h2>
            <p className="mt-1 text-sm text-base-content/60">Dicta o muestra este código en caja.</p>
          </>
        )}

        <div className="mt-5 rounded-2xl bg-base-200 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{ticket.merchantName}</p>
          <p className="mt-1 text-sm font-semibold">{ticket.offerTitle}</p>
          {ticket.costMP !== null && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-base-content/60">Monto pagado:</span>
              <span className="font-bold">{ticket.costMP} MP</span>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Código de canje</p>
          <p className="rounded-xl border-2 border-dashed border-primary bg-primary/5 py-3 text-2xl font-bold tracking-widest text-primary">
            {ticket.code}
          </p>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-base-300 px-3 py-2 text-xs text-base-content/50"
            disabled
          >
            <span>Transacción On-Chain: mock — no disponible aún</span>
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          </button>

          {status === "active" && (
            <p className="badge badge-warning badge-outline">
              Este código expira en {formatCountdown(ticket.expiresAt - now)}
            </p>
          )}
          {status === "redeemed" && <p className="badge badge-success badge-outline">Canjeado</p>}
          {status === "expired" && <p className="badge badge-error badge-outline">Expirado</p>}
        </div>

        <button type="button" className="btn btn-neutral mt-6 w-full" onClick={onClose}>
          Volver al Inicio
        </button>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
