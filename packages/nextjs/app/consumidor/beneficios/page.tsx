"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ConsumerHeader } from "~~/components/michi/ConsumerHeader";
import { OfferCard } from "~~/components/michi/OfferCard";
import { RedeemConfirmModal } from "~~/components/michi/RedeemConfirmModal";
import { TicketCodeModal } from "~~/components/michi/TicketCodeModal";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import {
  CATEGORY_LABELS,
  MICHI_PET_LEVELS,
  type Offer,
  type OfferCategory,
  type Ticket,
  useConsumerOffers,
  useConsumerPetLevel,
  useConsumerTickets,
} from "~~/hooks/michi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const CATEGORIES: ("todos" | OfferCategory)[] = ["todos", "cafeteria", "restaurante", "servicio", "tienda"];

const BeneficiosPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [category, setCategory] = useState<"todos" | OfferCategory>("todos");

  const { data: balance } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "balanceOf",
    args: [connectedAddress],
  });
  const balanceNumber = balance !== undefined ? Number(formatEther(balance)) : 0;

  const { offers, isUnlocked, currentLevel } = useConsumerOffers(balanceNumber, category);
  const { currentLevel: petLevel } = useConsumerPetLevel(balanceNumber);
  const aiOffers = offers.filter(o => o.aiPick);

  const ticketsHook = useConsumerTickets(connectedAddress);

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<Ticket | null>(null);

  const handleRedeem = (offer: Offer) => setSelectedOffer(offer);

  const handleConfirm = async () => {
    if (!selectedOffer) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    const ticket = ticketsHook.createTicket(selectedOffer);
    setIsSubmitting(false);
    setSelectedOffer(null);
    setSuccessTicket(ticket);
    notification.success("¡Canje exitoso!");
  };

  const requiredLevelTitle = (levelRequired: number) =>
    MICHI_PET_LEVELS.find(l => l.level === levelRequired)?.title ?? "Nivel superior";

  const mpMissing = (levelRequired: number) => {
    const required = MICHI_PET_LEVELS.find(l => l.level === levelRequired)?.mpRequired ?? 0;
    return Math.max(0, required - balanceNumber);
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base-200 px-4">
        <div className="card max-w-sm bg-base-100 p-6 text-center shadow-xl">
          <p className="mb-4 text-sm text-base-content/70">Conecta tu wallet para ver los beneficios disponibles.</p>
          <div className="flex justify-center">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-base-200">
      <ConsumerHeader />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">
              Explora tus <span className="text-primary">Beneficios</span> 🎁
            </h1>
            <p className="mt-1 text-sm text-base-content/70">
              Descubre dónde usar tus MichiPoints y activa cupones exclusivos.
            </p>
          </div>
          <div className="card border border-base-300 bg-base-100 px-4 py-3 text-right shadow-sm">
            <p className="text-xs text-base-content/60">Poder Adquisitivo</p>
            <p className="text-lg font-bold text-primary">{balanceNumber.toLocaleString("es-PE")} MP</p>
            <p className="text-xs text-base-content/50">≈ S/ {balanceNumber.toLocaleString("es-PE")}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              className={`btn btn-sm ${category === c ? "btn-neutral" : "btn-ghost bg-base-100"}`}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {aiOffers.length > 0 && (
          <section className="card mt-5 border border-accent/30 bg-accent/5 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="badge badge-accent badge-sm gap-1">
                <Sparkles className="size-3" aria-hidden="true" /> Selección Michi IA
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold">Para tu fin de semana</h2>
            <p className="text-sm text-base-content/60">
              Basado en tus compras, encontramos estos lugares que te encantarán cerca de ti.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {aiOffers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  unlocked={isUnlocked(offer)}
                  requiredLevelTitle={requiredLevelTitle(offer.levelRequired)}
                  mpMissing={mpMissing(offer.levelRequired)}
                  onRedeem={handleRedeem}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-bold">Todos los comercios afiliados</h2>
          <p className="mt-1 text-xs text-base-content/50">
            Tu nivel actual: {petLevel.icon} {petLevel.title} (Lv.{currentLevel.level})
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                unlocked={isUnlocked(offer)}
                requiredLevelTitle={requiredLevelTitle(offer.levelRequired)}
                mpMissing={mpMissing(offer.levelRequired)}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        </section>
      </main>

      {selectedOffer && (
        <RedeemConfirmModal
          offer={selectedOffer}
          isSubmitting={isSubmitting}
          onCancel={() => setSelectedOffer(null)}
          onConfirm={handleConfirm}
        />
      )}
      {successTicket && <TicketCodeModal ticket={successTicket} justRedeemed onClose={() => setSuccessTicket(null)} />}
    </div>
  );
};

export default BeneficiosPage;
