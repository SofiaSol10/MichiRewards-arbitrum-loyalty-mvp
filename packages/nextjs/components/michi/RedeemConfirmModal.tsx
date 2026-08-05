"use client";

import { X, Zap } from "lucide-react";
import type { Offer } from "~~/hooks/michi";

type RedeemConfirmModalProps = {
  offer: Offer;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RedeemConfirmModal({ offer, isSubmitting, onCancel, onConfirm }: RedeemConfirmModalProps) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Confirmar canje</h2>
          <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={onCancel} disabled={isSubmitting}>
            <X className="size-4" /> Cerrar
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-base-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{offer.merchantName}</p>
          <p className="mt-1 text-sm font-semibold">{offer.title}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-base-content/60">Costo</span>
            <span className="font-bold text-primary">
              {offer.costMP !== null ? `${offer.costMP} MP` : "Cupón gratis"}
            </span>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-base-content/60">
          <Zap className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          Los costos de red (Gas Fees) son sponsorizados — esta acción es gratis para ti.
        </p>

        <button type="button" className="btn btn-primary mt-5 w-full" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : "Aprobar Transacción"}
        </button>
      </div>
      <div className="modal-backdrop" onClick={isSubmitting ? undefined : onCancel} />
    </div>
  );
}
