"use client";

import { useCallback, useState } from "react";
import type { ChatMessage } from "~~/services/ai/types";
import { notification } from "~~/utils/scaffold-eth";

export type { ChatMessage };

/**
 * Generic chat-session hook shared by the consumer ("Michi Sabio") and merchant
 * ("Don Michi") AI advisors. `buildContext` runs fresh on every send so the request
 * always carries live on-chain data — the server routes are stateless.
 */
export function useAiChat<TContext>(endpoint: string, buildContext: () => TContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const history = messages;
      setMessages(prev => [...prev, { role: "user", text: trimmed }]);
      setIsSending(true);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history, context: buildContext() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo obtener respuesta.");
        setMessages(prev => [...prev, { role: "model", text: data.reply as string }]);
      } catch (e: any) {
        notification.error(e?.message ?? "No se pudo conectar con la IA.");
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, endpoint, buildContext],
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, isSending, sendMessage, reset };
}
