"use client";

import { ChatModal } from "./ChatModal";
import { Sparkles } from "lucide-react";
import { useAiChat } from "~~/hooks/michi";
import type { ConsumerAiContext } from "~~/services/ai/types";

const SUGGESTIONS = [
  "Hoy quiero algo fresco, ¿qué me recomiendas?",
  "¿Qué puedo canjear ahora mismo?",
  "¿Cómo subo de nivel más rápido?",
];

type MichiSabioChatProps = {
  buildContext: () => ConsumerAiContext;
  onClose: () => void;
};

export function MichiSabioChat({ buildContext, onClose }: MichiSabioChatProps) {
  const { messages, isSending, sendMessage } = useAiChat("/api/ai/consumer/chat", buildContext);

  return (
    <ChatModal
      title="Michi Sabio"
      subtitle="Tu asesor de recompensas"
      icon={Sparkles}
      placeholder="Escríbele a Michi Sabio…"
      emptyState="Contame qué se te antoja hoy y te recomiendo beneficios reales de la red 🐾"
      suggestions={SUGGESTIONS}
      messages={messages}
      isSending={isSending}
      onSend={sendMessage}
      onClose={onClose}
    />
  );
}
