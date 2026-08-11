"use client";

import { useEffect, useState } from "react";
import type { AiTip, MerchantAiContext } from "~~/services/ai/types";

/**
 * Proactive tips for the merchant dashboard ("Don Michi"). Fires once when the
 * benefit catalog/XP are ready and fails silently — nice-to-have, not blocking.
 */
export function useAiMerchantTips(context: MerchantAiContext | null) {
  const [tips, setTips] = useState<AiTip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const benefitsCount = context?.benefits.length ?? 0;
  const levelNumber = context?.levelNumber ?? 0;

  useEffect(() => {
    if (!context || context.benefits.length === 0) {
      setTips([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch("/api/ai/merchant/tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo obtener tips.");
        if (!cancelled) setTips(data.tips ?? []);
      })
      .catch(e => {
        if (cancelled) return;
        console.error("Error al obtener tips de IA:", e);
        setError(e?.message ?? "No se pudo obtener tips.");
        setTips([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benefitsCount, levelNumber, refetchToken]);

  const refetch = () => setRefetchToken(t => t + 1);

  return { tips, isLoading, error, refetch };
}
