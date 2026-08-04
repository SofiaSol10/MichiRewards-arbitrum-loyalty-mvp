"use client";

import { useState } from "react";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const MerchantDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const [saleCustomer, setSaleCustomer] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [chargeCustomer, setChargeCustomer] = useState("");
  const [chargeCoins, setChargeCoins] = useState("");

  const { data: isMerchant } = useScaffoldReadContract({
    contractName: "MichiCoin",
    functionName: "merchants",
    args: [connectedAddress],
  });

  const { data: balance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "MichiCoin",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: rewardRate } = useScaffoldReadContract({
    contractName: "MichiCoin",
    functionName: "rewardRate",
  });

  const { writeContractAsync: writeMichiCoin, isPending } = useScaffoldWriteContract({
    contractName: "MichiCoin",
  });

  const rate = rewardRate ?? 10n;
  const coinsToGive = saleAmount ? BigInt(Math.max(0, Math.floor(Number(saleAmount)))) * rate : 0n;

  const handleRegisterSale = async () => {
    if (!saleCustomer || !saleAmount) {
      notification.error("Completa la dirección del cliente y el monto de la venta.");
      return;
    }
    try {
      await writeMichiCoin({
        functionName: "mintRewardToken",
        args: [saleCustomer, BigInt(saleAmount)],
      });
      notification.success("MichiCoins entregados al cliente");
      setSaleAmount("");
      refetchBalance();
    } catch (e: any) {
      console.error("Error al registrar la venta:", e);
    }
  };

  const handleChargeCoins = async () => {
    if (!chargeCustomer || !chargeCoins) {
      notification.error("Completa la dirección del cliente y los MichiCoins a cobrar.");
      return;
    }
    try {
      await writeMichiCoin({
        functionName: "burnRewardToken",
        args: [chargeCustomer, BigInt(chargeCoins)],
      });
      notification.success("MichiCoins recibidos como pago");
      setChargeCoins("");
      refetchBalance();
    } catch (e: any) {
      console.error("Error al cobrar con MichiCoins:", e);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base-200 px-4">
        <div className="card max-w-sm bg-base-100 p-6 text-center shadow-xl">
          <p className="mb-4 text-sm text-base-content/70">Conecta tu wallet para ver el panel del comerciante.</p>
          <div className="flex justify-center">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-base-200">
      <header className="bg-neutral text-neutral-content">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-content">
              <CurrencyDollarIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight sm:text-lg">Michi Rewards</p>
              <p className="truncate text-xs opacity-75">Panel del comerciante</p>
            </div>
          </div>
          {connectedAddress && <Address address={connectedAddress} chain={targetNetwork} />}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-6">
        {!isMerchant && (
          <div className="alert alert-warning mb-5 text-sm">
            <BuildingStorefrontIcon className="size-5 shrink-0" />
            <span>
              Tu billetera no está registrada como comercio. Las acciones de esta pantalla requieren autorización del
              owner en <span className="font-semibold">/admin</span>.
            </span>
          </div>
        )}
        {isMerchant && (
          <p role="status" className="alert alert-success mb-5 text-sm font-medium">
            <CheckBadgeIcon className="size-5 shrink-0" />
            Negocio verificado — ya puedes dar y recibir MichiCoins
          </p>
        )}

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">¡Bienvenido!</h1>

            <section
              aria-labelledby="saldo-title"
              className="rounded-2xl bg-gradient-to-br from-primary to-accent px-6 py-6 text-center text-primary-content shadow-lg sm:py-7"
            >
              <h2 id="saldo-title" className="text-sm font-semibold uppercase tracking-wide">
                Saldo actual
              </h2>
              <p className="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">
                {balance !== undefined ? Number(formatEther(balance)).toLocaleString("es-PE") : "0"}
              </p>
              <p className="mt-1 text-sm font-medium">MichiCoin(s)</p>
              <span className="mt-4 inline-grid size-10 place-items-center rounded-full bg-primary-content/25">
                <CurrencyDollarIcon className="size-5" />
              </span>
            </section>

            <section className="card border border-base-300 bg-base-100 p-4 text-sm shadow-sm">
              <h2 className="font-semibold">Tasa de recompensa</h2>
              <p className="mt-1 text-base-content/70">
                Entregas <span className="font-semibold text-primary">{rate.toString()}x</span> el monto de cada venta
                en MichiCoins.
              </p>
            </section>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <section className="card border border-base-300 bg-base-200/70 p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <InformationCircleIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                ¿Cómo funcionan los MichiCoins?
              </h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Al registrar una venta</h3>
                  <p className="mt-1 text-sm text-base-content/70">
                    El cliente gana MichiCoins automáticamente según la tasa de recompensa vigente.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Al cobrar con MichiCoins</h3>
                  <p className="mt-1 text-sm text-base-content/70">
                    El cliente paga con sus MichiCoins — tú los recibes y quedan registrados on-chain.
                  </p>
                </div>
              </div>
            </section>

            <div className="card grid overflow-hidden border border-base-300 bg-base-100 shadow-sm md:grid-cols-2">
              <form aria-labelledby="venta-title" className="space-y-4 p-5 sm:p-6" onSubmit={e => e.preventDefault()}>
                <div className="flex items-center gap-2 text-success">
                  <ReceiptPercentIcon className="size-5 shrink-0" aria-hidden="true" />
                  <h2 id="venta-title" className="text-lg font-bold">
                    Registrar una venta
                  </h2>
                </div>
                <p className="text-sm text-base-content/70">
                  Dale MichiCoins al cliente por su compra. Tasa actual: {rate.toString()}x.
                </p>

                <div className="space-y-1">
                  <label className="label text-xs font-semibold">Wallet del cliente</label>
                  <AddressInput value={saleCustomer} onChange={setSaleCustomer} placeholder="0x..." />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs font-semibold">Monto de la venta</label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full"
                    placeholder="ej. 50"
                    value={saleAmount}
                    onChange={e => setSaleAmount(e.target.value)}
                  />
                </div>

                <p className="flex items-center justify-between gap-3 rounded-lg bg-base-200 px-4 py-3 text-sm">
                  <span className="text-base-content/70">MichiCoins a dar</span>
                  <span className="font-bold text-success">{coinsToGive.toString()} MichiCoins</span>
                </p>

                <button
                  type="submit"
                  className="btn btn-success w-full gap-2 text-white"
                  onClick={handleRegisterSale}
                  disabled={isPending}
                >
                  <SparklesIcon className="size-4" aria-hidden="true" />
                  Dar MichiCoins al cliente
                </button>
              </form>

              <form
                aria-labelledby="cobro-title"
                className="space-y-4 border-t border-base-300 p-5 sm:p-6 md:border-l md:border-t-0"
                onSubmit={e => e.preventDefault()}
              >
                <div className="flex items-center gap-2 text-primary">
                  <QrCodeIcon className="size-5 shrink-0" aria-hidden="true" />
                  <h2 id="cobro-title" className="text-lg font-bold">
                    Cobrar con MichiCoins
                  </h2>
                </div>
                <p className="text-sm text-base-content/70">El cliente paga con sus MichiCoins.</p>

                <div className="space-y-1">
                  <label className="label text-xs font-semibold">Wallet del cliente</label>
                  <AddressInput value={chargeCustomer} onChange={setChargeCustomer} placeholder="0x..." />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs font-semibold">MichiCoins a cobrar</label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full"
                    placeholder="ej. 50"
                    value={chargeCoins}
                    onChange={e => setChargeCoins(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full gap-2"
                  onClick={handleChargeCoins}
                  disabled={isPending}
                >
                  <CurrencyDollarIcon className="size-4" aria-hidden="true" />
                  Recibir MichiCoins como pago
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MerchantDashboard;
