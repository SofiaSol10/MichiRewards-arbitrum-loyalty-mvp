"use client";

import { useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { InformationCircleIcon, ShoppingBagIcon, WalletIcon } from "@heroicons/react/24/outline";
import { ConsumerHeader } from "~~/components/michi/ConsumerHeader";
import { OfferCard } from "~~/components/michi/OfferCard";
import { RedeemConfirmModal } from "~~/components/michi/RedeemConfirmModal";
import { TicketCodeModal } from "~~/components/michi/TicketCodeModal";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import {
  MICHI_PET_LEVELS,
  MOCK_OFFERS,
  type Offer,
  type Ticket,
  useConsumerPetLevel,
  useConsumerTickets,
} from "~~/hooks/michi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const ConsumerDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  const { data: balance } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const balanceNumber = balance !== undefined ? Number(formatEther(balance)) : 0;
  const { currentLevel, nextLevel, progressPct, mpToNext } = useConsumerPetLevel(balanceNumber);

  const ticketsHook = useConsumerTickets(connectedAddress);
  const homeOffers = MOCK_OFFERS.filter(o => o.homePick);

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

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base-200 px-4">
        <div className="card max-w-sm bg-base-100 p-6 text-center shadow-xl">
          <p className="mb-4 text-sm text-base-content/70">Conecta tu wallet para ver tu panel de MichiPoints.</p>
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
        <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">¡Bienvenido de nuevo! 👋</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Aquí tienes el resumen de tu actividad y recompensas en la red.
        </p>

        <div className="mt-5 grid gap-5 sm:gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl bg-gradient-to-br from-primary to-accent px-6 py-6 text-primary-content shadow-lg sm:py-7">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <WalletIcon className="size-4" aria-hidden="true" /> Saldo Actual
            </h2>
            <p className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">{balanceNumber.toLocaleString("es-PE")}</p>
            <p className="mt-1 text-sm opacity-90">MichiPoint(s)</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black/10 px-4 py-2 text-sm">
              <span className="opacity-80">Poder Adquisitivo</span>
              <span className="font-bold">
                S/ {balanceNumber.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </section>

          <section className="card border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <InformationCircleIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              ¿Cómo funcionan los MichiPoints?
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Al comprar en locales</h3>
                <p className="mt-1 text-sm text-base-content/70">
                  El cajero registra tu compra y te asigna MichiPoints según el monto gastado (por ejemplo, 1 punto por cada S/1 o el monto redondeado).
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Al pagar con MichiPoints</h3>
                <p className="mt-1 text-sm text-base-content/70">
                  Usa tus MichiPoints para canjear Beneficios de los comercios afiliados.
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-content">
              Después de cada compra, el comercio te asigna MichiPoints equivalentes al monto de tu compra (o al valor redondeado según sus reglas).
            </p>
          </section>
        </div>

        <section className="card mt-5 border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Tu Michi Virtual</h2>
              <p className="mt-1 text-2xl font-bold text-primary">
                {currentLevel.icon} {currentLevel.title}{" "}
                <span className="badge badge-outline badge-sm align-middle">Lv.{currentLevel.level}</span>
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                {nextLevel
                  ? `Faltan ${mpToNext.toLocaleString("es-PE")} MichiPoints para evolucionar`
                  : "¡Alcanzaste el nivel máximo!"}
              </p>
            </div>
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-secondary text-4xl">
              {currentLevel.icon}
            </span>
          </div>
          <div className="mt-4">
            <progress className="progress progress-primary w-full" value={progressPct} max={100} />
            <div className="mt-1 flex justify-between text-xs text-base-content/50">
              <span>{currentLevel.mpRequired.toLocaleString("es-PE")} MP</span>
              <span>{(nextLevel ?? currentLevel).mpRequired.toLocaleString("es-PE")} MP</span>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="size-4 text-accent" aria-hidden="true" /> Michi IA — Ofertas recomendadas para ti
            </h2>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {homeOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} unlocked onRedeem={handleRedeem} />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ShoppingBagIcon className="size-4 text-primary" aria-hidden="true" /> El camino de tu Michi
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {MICHI_PET_LEVELS.map(level => {
              const reached = currentLevel.level >= level.level;
              const isCurrent = currentLevel.level === level.level;
              return (
                <div
                  key={level.level}
                  className={`card flex flex-col items-center gap-1 border p-3 text-center ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : reached
                        ? "border-success/40 bg-success/5"
                        : "border-base-300 bg-base-100 opacity-60"
                  }`}
                >
                  <span className="text-2xl">{level.icon}</span>
                  <p className="text-xs font-semibold">{level.title}</p>
                  {reached ? (
                    <Check className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-base-content/50">
                      <Lock className="size-3" aria-hidden="true" />
                      {level.mpRequired.toLocaleString("es-PE")} MP
                    </span>
                  )}
                </div>
              );
            })}
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

export default ConsumerDashboard;
