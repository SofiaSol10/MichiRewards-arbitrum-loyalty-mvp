"use client";

import { useEffect, useState } from "react";
import type { AiRecommendation, ConsumerAiContext } from "~~/services/ai/types";

/**
 * Proactive "Recomendado para ti" picks for the consumer home page. Fires once when
 * the offer catalog/level are ready (keyed on a stable signature, not the object
 * identity) and fails silently — this is a nice-to-have, not a blocking action.
 */
export function useAiRecommendations(context: ConsumerAiContext | null) {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const offerIdsSignature = context?.offers.map(o => o.id).join(",") ?? "";
  const levelNumber = context?.levelNumber ?? 0;

  useEffect(() => {
    if (!context || context.offers.length === 0) {
      setRecommendations([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch("/api/ai/consumer/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo obtener recomendaciones.");
        if (!cancelled) setRecommendations(data.recommendations ?? []);
      })
      .catch(e => {
        if (cancelled) return;
        console.error("Error al obtener recomendaciones de IA:", e);
        setError(e?.message ?? "No se pudo obtener recomendaciones.");
        setRecommendations([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerIdsSignature, levelNumber, refetchToken]);

  const refetch = () => setRefetchToken(t => t + 1);

  return { recommendations, isLoading, error, refetch };
}
