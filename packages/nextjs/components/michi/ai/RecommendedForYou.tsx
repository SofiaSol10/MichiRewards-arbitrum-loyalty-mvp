"use client";

import { Sparkles } from "lucide-react";
import { OfferCard } from "~~/components/michi/OfferCard";
import { type Offer, useAiRecommendations } from "~~/hooks/michi";
import type { ConsumerAiContext } from "~~/services/ai/types";

type RecommendedForYouProps = {
  context: ConsumerAiContext | null;
  offers: Offer[];
  onRedeem: (offer: Offer) => void;
};

export function RecommendedForYou({ context, offers, onRedeem }: RecommendedForYouProps) {
  const { recommendations, isLoading } = useAiRecommendations(context);

  const picks = recommendations
    .map(rec => ({ rec, offer: offers.find(o => o.id === rec.offerId) }))
    .filter((p): p is { rec: (typeof recommendations)[number]; offer: Offer } => !!p.offer);

  if (!isLoading && picks.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Sparkles className="size-4 text-accent" aria-hidden="true" /> Recomendado para ti por Michi Sabio
      </h2>
      {isLoading ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-base-300/60" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map(({ rec, offer }) => (
            <div key={offer.id} className="space-y-2">
              <OfferCard offer={offer} unlocked onRedeem={onRedeem} />
              <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-content">🐾 {rec.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
