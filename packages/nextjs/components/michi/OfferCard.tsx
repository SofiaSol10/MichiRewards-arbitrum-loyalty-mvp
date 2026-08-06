import { Coffee, Lock, Sparkles, Store, Utensils } from "lucide-react";
import type { Offer } from "~~/hooks/michi";

const CATEGORY_ICONS = {
  coffee: Coffee,
  utensils: Utensils,
  sparkles: Sparkles,
  store: Store,
} as const;

type OfferCardProps = {
  offer: Offer;
  unlocked: boolean;
  requiredLevelTitle?: string;
  mpMissing?: number;
  onRedeem: (offer: Offer) => void;
};

export function OfferCard({ offer, unlocked, requiredLevelTitle, mpMissing, onRedeem }: OfferCardProps) {
  const Icon = CATEGORY_ICONS[offer.icon];

  return (
    <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-primary/80 to-accent/80">
        <Icon className="size-10 text-primary-content/90" aria-hidden="true" />
        <span className="badge badge-neutral absolute right-2 top-2 badge-sm font-semibold">{offer.badge}</span>

        {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 px-3 text-center text-white">
            <Lock className="size-5" aria-hidden="true" />
            <p className="text-xs font-semibold">Nivel Requerido</p>
          </div>
        )}
      </div>

      <div className="space-y-2 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{offer.merchantName}</p>
        <p className="text-sm font-medium leading-snug">{offer.title}</p>
        <p className="text-xs text-base-content/60">{offer.subtitle}</p>

        {unlocked ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            {offer.costMP !== null ? (
              <span className="text-sm font-bold text-primary">{offer.costMP} MP</span>
            ) : (
              <span className="text-xs text-base-content/50">Sin costo en MP</span>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onRedeem(offer)}>
              {offer.cta}
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-base-content/60">
              Necesitas ser <span className="font-semibold">{requiredLevelTitle}</span>
              {typeof mpMissing === "number" && mpMissing > 0 && (
                <>
                  {" · "}Faltan {mpMissing.toLocaleString("es-PE")} MP
                </>
              )}
            </p>
            <button type="button" className="btn btn-disabled btn-sm w-full" disabled>
              Bloqueado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
