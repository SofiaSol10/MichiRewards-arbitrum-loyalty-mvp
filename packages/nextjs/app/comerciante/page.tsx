"use client";

import { useEffect, useMemo, useState } from "react";
import { Address, AddressInput } from "@scaffold-ui/components";
import { Cat } from "lucide-react";
import type { NextPage } from "next";
import type { Address as AddressType } from "viem";
import { useAccount } from "wagmi";
import {
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import {
  BENEFIT_LEVELS,
  type Benefit,
  type BenefitLevel,
  MAX_SLOTS_PER_LEVEL,
  useClientDirectory,
  useMerchantBenefits,
} from "~~/hooks/michi";
import {
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useTargetNetwork,
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type Tab = "michipoints" | "beneficios";

const businessNameKey = (address?: string) => `michi:business-name:${address?.toLowerCase() ?? "anon"}`;

const ClientIdentifierField = ({
  label,
  placeholder,
  value,
  onChange,
  directory,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  directory: ReturnType<typeof useClientDirectory>;
}) => {
  const [pendingWallet, setPendingWallet] = useState("");
  const trimmed = value.trim();
  const looksLikeEmail = trimmed !== "" && !directory.isAddress(trimmed);
  const isKnownEmail = looksLikeEmail && !!directory.directory[trimmed.toLowerCase()];

  return (
    <div className="space-y-2">
      <div>
        <label className="label text-xs font-semibold">{label}</label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      {looksLikeEmail && !isKnownEmail && (
        <div className="space-y-2 rounded-lg border border-dashed border-warning bg-warning/10 p-3">
          <p className="text-xs text-base-content/70">
            No encontramos una wallet guardada para <span className="font-semibold">{trimmed}</span>. Asociala una vez y
            quedará recordada en este dispositivo.
          </p>
          <AddressInput value={pendingWallet} onChange={setPendingWallet} placeholder="Wallet del cliente 0x..." />
          <button
            type="button"
            className="btn btn-warning btn-xs"
            disabled={!pendingWallet}
            onClick={() => {
              directory.save(trimmed, pendingWallet as AddressType);
              setPendingWallet("");
            }}
          >
            Guardar correo → wallet
          </button>
        </div>
      )}
    </div>
  );
};

const MerchantDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [activeTab, setActiveTab] = useState<Tab>("michipoints");

  const [businessName, setBusinessName] = useState("Tu negocio");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (!connectedAddress) return;
    setBusinessName(localStorage.getItem(businessNameKey(connectedAddress)) ?? "Tu negocio");
  }, [connectedAddress]);

  const saveBusinessName = (value: string) => {
    const next = value.trim() || "Tu negocio";
    setBusinessName(next);
    if (connectedAddress) localStorage.setItem(businessNameKey(connectedAddress), next);
  };

  const [saleIdentifier, setSaleIdentifier] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [chargeIdentifier, setChargeIdentifier] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  const { data: isMerchant } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchants",
    args: [connectedAddress],
  });

  const { data: rewardRate } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "rewardRate",
  });

  const { writeContractAsync: writeMichiPoints, isPending } = useScaffoldWriteContract({
    contractName: "MichiPoints",
  });

  const { data: mintedEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "RewardMinted",
    watch: true,
    fromBlock: 0n,
  });

  const { data: redeemedEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "RewardRedeemed",
    watch: true,
    fromBlock: 0n,
  });

  const { totalGranted, totalSalesAmount } = useMemo(() => {
    let granted = 0n;
    let sales = 0n;
    mintedEvents?.forEach(evt => {
      if (evt.args.merchant?.toLowerCase() === connectedAddress?.toLowerCase()) {
        granted += evt.args.reward ?? 0n;
        sales += evt.args.purchaseAmount ?? 0n;
      }
    });
    return { totalGranted: granted, totalSalesAmount: sales };
  }, [mintedEvents, connectedAddress]);

  const totalRedeemed = useMemo(() => {
    let redeemed = 0n;
    redeemedEvents?.forEach(evt => {
      if (evt.args.merchant?.toLowerCase() === connectedAddress?.toLowerCase()) {
        redeemed += evt.args.amount ?? 0n;
      }
    });
    return redeemed;
  }, [redeemedEvents, connectedAddress]);

  const directory = useClientDirectory(connectedAddress);
  const resolvedSaleAddress = directory.resolve(saleIdentifier);
  const resolvedChargeAddress = directory.resolve(chargeIdentifier);

  const rate = rewardRate ?? 1n;
  const saleReward = saleAmount ? BigInt(Math.max(0, Math.floor(Number(saleAmount)))) * rate : 0n;
  const chargeTotal = chargeAmount ? BigInt(Math.max(0, Math.floor(Number(chargeAmount)))) : 0n;

  const benefitsHook = useMerchantBenefits(connectedAddress);
  const [benefitForm, setBenefitForm] = useState<{ level: BenefitLevel; editingId?: string } | null>(null);
  const [benefitName, setBenefitName] = useState("");
  const [benefitCost, setBenefitCost] = useState("");
  const [benefitStockMax, setBenefitStockMax] = useState("");

  const openBenefitForm = (level: BenefitLevel, existing?: Benefit) => {
    setBenefitForm({ level, editingId: existing?.id });
    setBenefitName(existing?.name ?? "");
    setBenefitCost(existing ? String(existing.cost) : "");
    setBenefitStockMax(existing ? String(existing.stockMax) : "");
  };

  const closeBenefitForm = () => setBenefitForm(null);

  const handleSaveBenefit = () => {
    if (!benefitForm) return;
    const cost = Number(benefitCost);
    const stockMax = Number(benefitStockMax);
    if (!benefitName.trim() || !cost || !stockMax) {
      notification.error("Completa el nombre, el costo en puntos y el stock del beneficio.");
      return;
    }
    if (benefitForm.editingId) {
      benefitsHook.updateBenefit(benefitForm.editingId, { name: benefitName.trim(), cost, stockMax });
    } else {
      benefitsHook.addBenefit(benefitForm.level, { name: benefitName.trim(), cost, stockMax });
    }
    closeBenefitForm();
  };

  const handleRemoveBenefit = (id: string) => {
    if (window.confirm("¿Eliminar este beneficio?")) benefitsHook.removeBenefit(id);
  };

  const handleRegisterSale = async () => {
    if (!saleIdentifier || !saleAmount) {
      notification.error("Completa el cliente y el monto de la venta.");
      return;
    }
    if (!resolvedSaleAddress) {
      notification.error("Ingresá una wallet válida o asociá el correo a una wallet primero.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "mintRewardToken",
        args: [resolvedSaleAddress, BigInt(saleAmount)],
      });
      notification.success("MichiPoints otorgados al cliente");
      setSaleAmount("");
    } catch (e: any) {
      console.error("Error al registrar la venta:", e);
    }
  };

  const handleChargeCoins = async () => {
    if (!chargeIdentifier || !chargeAmount) {
      notification.error("Completa el cliente y los MichiPoints a cobrar.");
      return;
    }
    if (!resolvedChargeAddress) {
      notification.error("Ingresá una wallet válida o asociá el correo a una wallet primero.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "burnRewardToken",
        args: [resolvedChargeAddress, chargeTotal],
      });
      notification.success("MichiPoints recibidos como pago");
      setChargeAmount("");
    } catch (e: any) {
      console.error("Error al cobrar con MichiPoints:", e);
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
      <header className="border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-content">
              <Cat className="size-5" />
            </span>
            <p className="text-base font-bold leading-tight">Michi Rewards</p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-base-200 p-1">
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "michipoints" ? "btn-neutral" : "btn-ghost text-base-content/60"}`}
              onClick={() => setActiveTab("michipoints")}
            >
              Vista MichiPoints
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "beneficios" ? "btn-neutral" : "btn-ghost text-base-content/60"}`}
              onClick={() => setActiveTab("beneficios")}
            >
              Vista Beneficios
            </button>
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
            Negocio verificado — ya puedes dar MichiPoints y procesar pagos/canjes de tus clientes
          </p>
        )}

        {activeTab === "michipoints" ? (
          <div className="grid gap-5 sm:gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <input
                    autoFocus
                    className="input input-bordered input-sm flex-1"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    onBlur={() => {
                      saveBusinessName(businessName);
                      setEditingName(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                ) : (
                  <>
                    <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">¡Bienvenido, {businessName}!</h1>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setEditingName(true)}
                      aria-label="Editar nombre del negocio"
                    >
                      <PencilSquareIcon className="size-4" />
                    </button>
                  </>
                )}
              </div>

              <section className="rounded-2xl bg-gradient-to-br from-primary to-accent px-6 py-6 text-primary-content shadow-lg sm:py-7">
                <h2 className="text-sm font-semibold uppercase tracking-wide">MichiPoints Otorgados</h2>
                <p className="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">{totalGranted.toLocaleString()}</p>
                <p className="mt-1 text-sm opacity-90">Equivale a S/ {totalSalesAmount.toLocaleString()} en ventas</p>
              </section>

              <section className="card border-2 border-info bg-base-100 p-4 text-sm shadow-sm">
                <h2 className="font-semibold">Puntos Recibidos (Canjes)</h2>
                <p className="mt-1 text-3xl font-bold text-info">{totalRedeemed.toLocaleString()} pts</p>
              </section>

        
            </div>

            <div className="space-y-5 sm:space-y-6">
              <section className="card border border-base-300 bg-base-200/70 p-4 sm:p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <InformationCircleIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  ¿Cómo funciona el ciclo de MichiPoints en tu negocio?
                </h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold">1. Al registrar una venta</h3>
                    <p className="mt-1 text-sm text-base-content/70">
                      Por cada S/ 1 en compra, el cliente acumula {rate.toString()} MichiPoint{rate === 1n ? "" : "s"}{" "}
                      (ej. S/ 50 = {(50n * rate).toString()} pts).
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">2. Al cobrar con MichiPoints / Canjear</h3>
                    <p className="mt-1 text-sm text-base-content/70">
                      El cliente paga con su saldo de MichiPoints — vos los recibís y quedan registrados on-chain.
                    </p>
                  </div>
                </div>
              </section>

              <div className="card grid overflow-hidden border border-base-300 bg-base-100 shadow-sm md:grid-cols-2">
                <form aria-labelledby="venta-title" className="space-y-4 p-5 sm:p-6" onSubmit={e => e.preventDefault()}>
                  <div className="flex items-center gap-2 text-info">
                    <ReceiptPercentIcon className="size-5 shrink-0" aria-hidden="true" />
                    <h2 id="venta-title" className="text-lg font-bold">
                      1. Otorgar MichiPoints (Venta)
                    </h2>
                  </div>
                  <p className="text-sm text-base-content/70">Recompensa la compra de tu cliente con puntos.</p>

                  <ClientIdentifierField
                    label="Identificador del cliente (correo/wallet)"
                    placeholder="cliente@correo.com o 0x..."
                    value={saleIdentifier}
                    onChange={setSaleIdentifier}
                    directory={directory}
                  />

                  <div className="space-y-1">
                    <label className="label text-xs font-semibold">Monto consumido (S/)</label>
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
                    <span className="text-base-content/70">MichiPoints generados para cliente:</span>
                    <span className="font-bold text-info">+{saleReward.toString()} pts</span>
                  </p>

                  <button
                    type="submit"
                    className="btn btn-info w-full gap-2 text-white"
                    onClick={handleRegisterSale}
                    disabled={isPending || !resolvedSaleAddress || !saleAmount}
                  >
                    <SparklesIcon className="size-4" aria-hidden="true" />
                    Registrar Venta y Asignar Puntos
                  </button>
                </form>

                <form
                  aria-labelledby="cobro-title"
                  className="space-y-4 border-t border-base-300 p-5 sm:p-6 md:border-l md:border-t-0"
                  onSubmit={e => e.preventDefault()}
                >
                  <div className="flex items-center gap-2 text-secondary">
                    <QrCodeIcon className="size-5 shrink-0" aria-hidden="true" />
                    <h2 id="cobro-title" className="text-lg font-bold">
                      Cobrar / Validar Canje
                    </h2>
                  </div>
                  <p className="text-sm text-base-content/70">Recibe MichiPoints como pago de un producto.</p>

                  <ClientIdentifierField
                    label="Cliente (correo/wallet)"
                    placeholder="cliente@correo.com o 0x..."
                    value={chargeIdentifier}
                    onChange={setChargeIdentifier}
                    directory={directory}
                  />
                  <p className="text-xs text-base-content/50">
                    Los códigos de cupón de la pestaña Beneficios todavía no están conectados a esta acción.
                  </p>

                  <div className="space-y-1">
                    <label className="label text-xs font-semibold">MichiPoints a cobrar</label>
                    <input
                      type="number"
                      min="0"
                      className="input input-bordered w-full"
                      placeholder="ej. 50"
                      value={chargeAmount}
                      onChange={e => setChargeAmount(e.target.value)}
                    />
                  </div>

                  <p className="flex items-center justify-between gap-3 rounded-lg bg-base-200 px-4 py-3 text-sm">
                    <span className="text-base-content/70">Total a cobrar en puntos:</span>
                    <span className="font-bold text-secondary">-{chargeTotal.toString()} pts</span>
                  </p>

                  <button
                    type="submit"
                    className="btn btn-secondary w-full gap-2"
                    onClick={handleChargeCoins}
                    disabled={isPending || !resolvedChargeAddress || !chargeAmount}
                  >
                    <CurrencyDollarIcon className="size-4" aria-hidden="true" />
                    Procesar Cobro / Canje
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Gestión de Beneficios & Recompensas</h1>
              <p className="mt-1 text-sm text-base-content/70">
                Configura las recompensas que ofrecerás a tus clientes según el nivel de su Michi.
              </p>
            </div>

            {BENEFIT_LEVELS.map(({ level, title, icon }) => {
              const levelBenefits = benefitsHook.benefits.filter(b => b.level === level);
              const slots = Array.from({ length: MAX_SLOTS_PER_LEVEL }, (_, i) => levelBenefits[i]);
              const isFull = levelBenefits.length >= MAX_SLOTS_PER_LEVEL;

              return (
                <section key={level} className="rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                      <span aria-hidden="true">{icon}</span> Beneficios de nivel {title} (Nivel {level})
                    </h2>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs gap-1"
                      disabled={isFull}
                      onClick={() => openBenefitForm(level)}
                    >
                      <PlusCircleIcon className="size-4" /> Añadir Beneficio
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {slots.map((benefit, idx) =>
                      benefit ? (
                        <div key={benefit.id} className="card border border-base-300 bg-base-100 p-3 text-xs shadow-sm">
                          <p className="font-semibold">{benefit.name}</p>
                          <p className="mt-1 text-base-content/60">
                            Stock: {benefit.stockCurrent}/{benefit.stockMax}
                          </p>
                          <p className="text-base-content/60">Costo: {benefit.cost} pts</p>
                          <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              className="link text-info"
                              onClick={() => openBenefitForm(level, benefit)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="link flex items-center gap-1 text-error"
                              onClick={() => handleRemoveBenefit(benefit.id)}
                            >
                              <TrashIcon className="size-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          key={idx}
                          type="button"
                          className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-base-300 text-xs text-base-content/40 hover:border-primary hover:text-primary"
                          onClick={() => openBenefitForm(level)}
                        >
                          + Espacio libre
                        </button>
                      ),
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {benefitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeBenefitForm}>
          <div className="card w-full max-w-sm bg-base-100 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{benefitForm.editingId ? "Editar beneficio" : "Nuevo beneficio"}</h3>
            <p className="text-xs text-base-content/60">
              {BENEFIT_LEVELS.find(l => l.level === benefitForm.level)?.title}
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="label text-xs font-semibold">Nombre</label>
                <input
                  className="input input-bordered w-full"
                  value={benefitName}
                  onChange={e => setBenefitName(e.target.value)}
                  placeholder="ej. Descuento 10% Café"
                />
              </div>
              <div>
                <label className="label text-xs font-semibold">Costo (pts)</label>
                <input
                  type="number"
                  min="0"
                  className="input input-bordered w-full"
                  value={benefitCost}
                  onChange={e => setBenefitCost(e.target.value)}
                  placeholder="ej. 50"
                />
              </div>
              <div>
                <label className="label text-xs font-semibold">Stock máximo</label>
                <input
                  type="number"
                  min="0"
                  className="input input-bordered w-full"
                  value={benefitStockMax}
                  onChange={e => setBenefitStockMax(e.target.value)}
                  placeholder="ej. 20"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={closeBenefitForm}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary flex-1" onClick={handleSaveBenefit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
