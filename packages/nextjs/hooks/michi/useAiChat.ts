"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "~~/services/ai/types";
import { notification } from "~~/utils/scaffold-eth";

export type { ChatMessage };

const HISTORY_LIMIT = 40;

function loadHistory(storageKey?: string): ChatMessage[] {
  if (!storageKey || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

/**
 * Generic chat-session hook shared by the consumer ("Michi Sabio") and merchant
 * ("Don Michi") AI advisors. `buildContext` runs fresh on every send so the request
 * always carries live on-chain data — the server routes are stateless. When
 * `storageKey` is given (e.g. keyed by connected wallet), the conversation persists
 * in localStorage and restores on remount/reopen.
 */
export function useAiChat<TContext>(endpoint: string, buildContext: () => TContext, storageKey?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(storageKey));
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMessages(loadHistory(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-HISTORY_LIMIT)));
  }, [messages, storageKey]);

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

  const reset = useCallback(() => {
    setMessages([]);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { messages, isSending, sendMessage, reset };
}
