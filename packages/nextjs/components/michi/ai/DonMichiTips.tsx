"use client";

import { Lightbulb } from "lucide-react";
import { useAiMerchantTips } from "~~/hooks/michi";
import type { MerchantAiContext } from "~~/services/ai/types";

type DonMichiTipsProps = {
  context: MerchantAiContext | null;
};

export function DonMichiTips({ context }: DonMichiTipsProps) {
  const { tips, isLoading } = useAiMerchantTips(context);

  if (!isLoading && tips.length === 0) return null;

  return (
    <section className="mb-5">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Lightbulb className="size-4 text-warning" aria-hidden="true" /> Tips de Don Michi
      </h2>
      {isLoading ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[0, 1].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-base-300/60" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {tips.map((tip, i) => (
            <div key={i} className="card border border-warning/30 bg-warning/10 p-3 text-xs">
              <p className="font-semibold">{tip.title}</p>
              <p className="mt-1 text-base-content/70">{tip.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
