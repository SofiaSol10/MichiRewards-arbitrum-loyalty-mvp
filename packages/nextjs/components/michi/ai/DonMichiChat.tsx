"use client";

import { ChatModal } from "./ChatModal";
import { Cat } from "lucide-react";
import { useAccount } from "wagmi";
import { useAiChat } from "~~/hooks/michi";
import type { MerchantAiContext } from "~~/services/ai/types";

const SUGGESTIONS = [
  "¿Cómo subo de nivel más rápido?",
  "¿Qué beneficios me faltan por nivel?",
  "Ayúdame a mejorar la redacción de mis beneficios",
];

type DonMichiChatProps = {
  buildContext: () => MerchantAiContext;
  onClose: () => void;
};

export function DonMichiChat({ buildContext, onClose }: DonMichiChatProps) {
  const { address } = useAccount();
  const storageKey = address ? `michi:chat:merchant:${address.toLowerCase()}` : undefined;
  const { messages, isSending, sendMessage } = useAiChat("/api/ai/merchant/chat", buildContext, storageKey);

  return (
    <ChatModal
      title="Don Michi"
      subtitle="Tu asesor de negocio"
      icon={Cat}
      placeholder="Escríbele a Don Michi…"
      emptyState="Contame sobre tu negocio y te doy ideas para mejorar tus beneficios y subir de nivel 🐾"
      suggestions={SUGGESTIONS}
      messages={messages}
      isSending={isSending}
      onSend={sendMessage}
      onClose={onClose}
    />
  );
}
