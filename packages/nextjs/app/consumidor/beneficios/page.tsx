"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MichiBrand, MichiShell } from "~~/components/MichiBrand";
import { ConsumerHeader } from "~~/components/michi/ConsumerHeader";
import { OfferCard } from "~~/components/michi/OfferCard";
import { RedeemConfirmModal } from "~~/components/michi/RedeemConfirmModal";
import { TicketCodeModal } from "~~/components/michi/TicketCodeModal";
import {
  MICHI_PET_LEVELS,
  type Offer,
  type Ticket,
  useAllRewards,
  useConsumerOffers,
  useConsumerPetLevel,
  useConsumerTickets,
  useRequireWallet,
} from "~~/hooks/michi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const BeneficiosPage: NextPage = () => {
  const authStatus = useRequireWallet();
  const { address: connectedAddress } = useAccount();

  const { data: balance } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "balanceOf",
    args: [connectedAddress],
  });
  const { data: totalPointsEarned } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "totalPointsEarned",
    args: [connectedAddress],
  });

  const balanceNumber = balance !== undefined ? Number(balance) : 0;
  const totalPointsEarnedNumber = totalPointsEarned !== undefined ? Number(totalPointsEarned) : 0;

  const { offers, isUnlocked, currentLevel, isLoading } = useConsumerOffers(totalPointsEarnedNumber);
  const { byId } = useAllRewards();
  const { currentLevel: petLevel } = useConsumerPetLevel(totalPointsEarnedNumber);

  const ticketsHook = useConsumerTickets(connectedAddress);

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<Ticket | null>(null);

  const handleRedeem = (offer: Offer) => setSelectedOffer(offer);

  const handleConfirm = async () => {
    if (!selectedOffer) return;
    const reward = byId.get(selectedOffer.id);
    if (!reward) {
      notification.error("Este beneficio ya no está disponible.");
      setSelectedOffer(null);
      return;
    }
    setIsSubmitting(true);
    try {
      const ticket = await ticketsHook.redeem(reward);
      setSelectedOffer(null);
      setSuccessTicket(ticket);
      notification.success("¡Canje exitoso!");
    } catch (e: any) {
      console.error("Error al canjear el beneficio:", e);
      notification.error(getParsedError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredLevelTitle = (levelRequired: number) =>
    MICHI_PET_LEVELS.find(l => l.level === levelRequired)?.title ?? "Nivel superior";

  const mpMissing = (levelRequired: number) => {
    const required = MICHI_PET_LEVELS.find(l => l.level === levelRequired)?.mpRequired ?? 0;
    return Math.max(0, required - totalPointsEarnedNumber);
  };

  if (authStatus !== "ready") {
    return (
      <MichiShell>
        <MichiBrand subtitle="Cargando tus beneficios…" />
      </MichiShell>
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
            <p className="text-xs text-base-content/60">Saldo disponible</p>
            <p className="text-lg font-bold text-primary">{balanceNumber.toLocaleString("es-PE")} MP</p>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-bold">Todos los comercios afiliados</h2>
          <p className="mt-1 text-xs text-base-content/50">
            Tu nivel actual: {petLevel.icon} {petLevel.title} (Lv.{currentLevel.level})
          </p>
          {isLoading ? (
            <span className="loading loading-spinner loading-sm mt-4"></span>
          ) : offers.length > 0 ? (
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
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-xs text-base-content/50">
              Todavía no hay beneficios publicados por los comercios afiliados.
            </p>
          )}
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
