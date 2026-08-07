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
  CheckIcon,
  ClockIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  SparklesIcon,
  TrashIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import {
  BENEFIT_LEVELS,
  type Benefit,
  type BenefitLevel,
  MAX_SLOTS_PER_LEVEL,
  MERCHANT_LEVELS,
  TICKET_TTL_MS,
  useClientDirectory,
  useMerchantBenefits,
  useMerchantLevel,
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
  const [ticketCode, setTicketCode] = useState("");

  const { data: isMerchant } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchants",
    args: [connectedAddress],
  });

  const { data: rewardRate } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "rewardRate",
  });

  const { data: totalPointsIssued, refetch: refetchIssued } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchantPointsIssued",
    args: [connectedAddress],
  });

  const { data: totalPointsRedeemed, refetch: refetchRedeemed } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchantPointsRedeemed",
    args: [connectedAddress],
  });

  const { data: merchantExperience, refetch: refetchExperience } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchantExperience",
    args: [connectedAddress],
  });

  const { writeContractAsync: writeMichiPoints, isPending } = useScaffoldWriteContract({
    contractName: "MichiPoints",
  });

  const totalGranted = totalPointsIssued ?? 0n;
  const totalRedeemed = totalPointsRedeemed ?? 0n;
  const experienceNumber = merchantExperience !== undefined ? Number(merchantExperience) : 0;
  const { currentLevel, nextLevel, progressPct, xpToNext } = useMerchantLevel(experienceNumber);

  const directory = useClientDirectory(connectedAddress);
  const resolvedSaleAddress = directory.resolve(saleIdentifier);

  const rate = rewardRate ?? 1n;
  const saleReward = saleAmount ? BigInt(Math.max(0, Math.floor(Number(saleAmount)))) * rate : 0n;
  const saleXpPreview = saleReward / 5n;

  const { data: purchaseEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "PurchaseRegistered",
    fromBlock: 0n,
    watch: true,
  });

  const { data: redeemEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "TicketGenerated",
    fromBlock: 0n,
    watch: true,
  });

  const formatEventTime = (unixSeconds: number) => {
    if (!unixSeconds) return "—";
    return new Date(unixSeconds * 1000).toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activity = useMemo(() => {
    if (!connectedAddress) return [];
    const merchantAddress = connectedAddress.toLowerCase();

    const sales = (purchaseEvents ?? [])
      .filter(evt => evt.args.merchant?.toLowerCase() === merchantAddress)
      .map(evt => ({
        key: `sale-${evt.transactionHash}-${evt.logIndex}`,
        type: "venta" as const,
        counterparty: evt.args.user,
        pointsLabel: `+${(evt.args.points ?? 0n).toString()} pts`,
        xp: (evt.args.points ?? 0n) / 5n,
        timestamp: evt.args.timestamp !== undefined ? Number(evt.args.timestamp) : 0,
      }));

    const redemptions = (redeemEvents ?? [])
      .filter(evt => evt.args.merchant?.toLowerCase() === merchantAddress)
      .map(evt => ({
        key: `redeem-${evt.transactionHash}-${evt.logIndex}`,
        type: "canje" as const,
        counterparty: evt.args.customer,
        pointsLabel: `-${(evt.args.pointsSpent ?? 0n).toString()} pts`,
        xp: evt.args.pointsSpent ?? 0n,
        // TicketGenerated has no timestamp arg, but `expiresAt = block.timestamp + TICKET_TTL`
        // (MichiPoints.sol), so subtracting the TTL recovers the redemption time for free.
        timestamp: evt.args.expiresAt !== undefined ? Number(evt.args.expiresAt) - TICKET_TTL_MS / 1000 : 0,
      }));

    return [...sales, ...redemptions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  }, [purchaseEvents, redeemEvents, connectedAddress]);

  const benefitsHook = useMerchantBenefits(connectedAddress);
  const [benefitForm, setBenefitForm] = useState<{ level: BenefitLevel; editingId?: string } | null>(null);
  const [benefitName, setBenefitName] = useState("");
  const [benefitCost, setBenefitCost] = useState("");
  const [benefitStock, setBenefitStock] = useState("");
  const [restockAmount, setRestockAmount] = useState("");

  const openBenefitForm = (level: BenefitLevel, existing?: Benefit) => {
    setBenefitForm({ level, editingId: existing?.id });
    setBenefitName(existing?.name ?? "");
    setBenefitCost(existing ? String(existing.cost) : "");
    setBenefitStock(existing ? String(existing.stock) : "");
    setRestockAmount("");
  };

  const closeBenefitForm = () => setBenefitForm(null);

  const editingBenefit = benefitForm?.editingId
    ? benefitsHook.benefits.find(b => b.id === benefitForm.editingId)
    : undefined;

  const handleSaveBenefit = async () => {
    if (!benefitForm) return;
    if (editingBenefit) {
      const amount = Number(restockAmount);
      if (amount > 0) await benefitsHook.restockBenefit(editingBenefit.id, amount);
      closeBenefitForm();
      return;
    }
    const cost = Number(benefitCost);
    const stock = Number(benefitStock);
    if (!benefitName.trim() || !cost || !stock) {
      notification.error("Completa el nombre, el costo en puntos y el stock del beneficio.");
      return;
    }
    try {
      await benefitsHook.addBenefit(benefitForm.level, { name: benefitName.trim(), cost, stock });
      notification.success("Beneficio publicado on-chain");
      closeBenefitForm();
    } catch (e: any) {
      console.error("Error al crear el beneficio:", e);
    }
  };

  const handleToggleActive = async (benefit: Benefit) => {
    try {
      await benefitsHook.toggleBenefitActive(benefit.id, !benefit.active);
      notification.success(benefit.active ? "Beneficio desactivado" : "Beneficio reactivado");
    } catch (e: any) {
      console.error("Error al actualizar el beneficio:", e);
    }
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
        functionName: "registerPurchase",
        args: [resolvedSaleAddress, BigInt(saleAmount)],
      });
      notification.success("MichiPoints otorgados al cliente");
      setSaleAmount("");
      refetchIssued();
      refetchExperience();
    } catch (e: any) {
      console.error("Error al registrar la venta:", e);
    }
  };

  const handleValidateTicket = async () => {
    if (!ticketCode.trim()) {
      notification.error("Ingresá el código de ticket que te muestra el cliente.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "validateTicket",
        args: [ticketCode.trim()],
      });
      notification.success("Ticket validado — canje procesado");
      setTicketCode("");
      refetchRedeemed();
    } catch (e: any) {
      console.error("Error al validar el ticket:", e);
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

          <div className="flex items-center gap-2">
            <span className="badge badge-warning badge-sm gap-1 font-bold">
              {currentLevel.icon} Nivel {currentLevel.level} · {currentLevel.title}
            </span>
            {connectedAddress && <Address address={connectedAddress} chain={targetNetwork} />}
          </div>
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

        <section className="card mb-5 overflow-hidden border border-base-300 bg-neutral p-5 text-neutral-content shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-content/60">
                Experiencia del negocio
              </p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums">{experienceNumber.toLocaleString("es-PE")}</span>
                <span className="text-sm font-semibold text-neutral-content/60">XP</span>
              </p>
              <p className="mt-1 text-xs text-neutral-content/50">
                Se suma ~20% de tus puntos otorgados por venta + el 100% de lo que tus clientes canjean
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-content/60">Rango actual</p>
              <p className="mt-1 text-xl font-bold">
                {currentLevel.icon} {currentLevel.title}{" "}
                <span className="badge badge-outline badge-sm align-middle">Nivel {currentLevel.level}</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <progress className="progress progress-warning w-full" value={progressPct} max={100} />
            <div className="mt-1 flex flex-wrap justify-between gap-1 text-[11px] text-neutral-content/50">
              <span>{currentLevel.xpRequired.toLocaleString("es-PE")} XP</span>
              <span>
                {nextLevel
                  ? `Faltan ${xpToNext.toLocaleString("es-PE")} XP para ${nextLevel.title}`
                  : "¡Nivel máximo alcanzado!"}
              </span>
              <span>{(nextLevel ?? currentLevel).xpRequired.toLocaleString("es-PE")} XP</span>
            </div>
          </div>
        </section>

        {activeTab === "michipoints" ? (
          <>
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
                      <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">
                        ¡Bienvenido, {businessName}!
                      </h1>
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
                  <p className="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">{totalGranted.toString()}</p>
                </section>

                <section className="card border-2 border-info bg-base-100 p-4 text-sm shadow-sm">
                  <h2 className="font-semibold">Puntos Recibidos (Canjes)</h2>
                  <p className="mt-1 text-3xl font-bold text-info">{totalRedeemed.toString()} pts</p>
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
                  <form
                    aria-labelledby="venta-title"
                    className="space-y-4 p-5 sm:p-6"
                    onSubmit={e => e.preventDefault()}
                  >
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
                    <p className="flex items-center justify-between gap-2 px-1 text-xs text-base-content/50">
                      <span>XP ganada para tu comercio (20%):</span>
                      <span className="font-semibold text-warning">+{saleXpPreview.toString()} XP</span>
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
                        Validar Ticket de Canje
                      </h2>
                    </div>
                    <p className="text-sm text-base-content/70">
                      Ingresá el código que te muestra el cliente en caja (ej. MCH-74LD-5) para validar su canje.
                    </p>

                    <div className="space-y-1">
                      <label className="label text-xs font-semibold">Código del ticket</label>
                      <input
                        type="text"
                        className="input input-bordered w-full uppercase"
                        placeholder="MCH-XXXX-X"
                        value={ticketCode}
                        onChange={e => setTicketCode(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-secondary w-full gap-2"
                      onClick={handleValidateTicket}
                      disabled={isPending || !ticketCode.trim()}
                    >
                      <CheckBadgeIcon className="size-4" aria-hidden="true" />
                      Validar Ticket
                    </button>

                    <p className="rounded-lg bg-base-200 px-3 py-2 text-xs text-base-content/50">
                      Cuando tu cliente canjea un beneficio ya suma el 100% de esos puntos a tu experiencia de comercio
                      — validar el ticket solo confirma la entrega en caja.
                    </p>
                  </form>
                </div>
              </div>
            </div>

            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <TrophyIcon className="size-4 text-warning" aria-hidden="true" /> Escala de Niveles de Comerciante
              </h2>
              <p className="mt-1 text-xs text-base-content/60">
                Sube de nivel sumando experiencia (XP) con cada venta que registrás (+20%) y, sobre todo, con cada canje
                que confirman tus clientes (+100%).
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {MERCHANT_LEVELS.map(level => {
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
                        <CheckIcon className="size-4 text-success" aria-hidden="true" />
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-base-content/50">
                          <LockClosedIcon className="size-3" aria-hidden="true" />
                          {level.xpRequired.toLocaleString("es-PE")} XP
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <ClockIcon className="size-4 text-primary" aria-hidden="true" /> Historial de Operaciones y XP Generada
              </h2>
              {activity.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-base-300">
                  <table className="table table-sm w-full bg-base-100">
                    <thead>
                      <tr className="text-xs uppercase text-base-content/50">
                        <th>Tipo</th>
                        <th>Cliente</th>
                        <th>Puntos</th>
                        <th>XP Generada</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map(entry => (
                        <tr key={entry.key}>
                          <td>
                            <span
                              className={`badge badge-sm ${entry.type === "venta" ? "badge-info" : "badge-success"}`}
                            >
                              {entry.type === "venta" ? "Venta" : "Canje"}
                            </span>
                          </td>
                          <td>
                            <Address address={entry.counterparty} />
                          </td>
                          <td className="font-mono text-xs">{entry.pointsLabel}</td>
                          <td className="font-mono text-xs font-bold text-warning">+{entry.xp.toString()} XP</td>
                          <td className="text-xs text-base-content/50">{formatEventTime(entry.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-base-300 bg-base-100 p-4 text-center text-xs text-base-content/50">
                  Todavía no hay ventas ni canjes registrados para tu negocio.
                </p>
              )}
            </section>
          </>
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
                        <div
                          key={benefit.id}
                          className={`card border border-base-300 bg-base-100 p-3 text-xs shadow-sm ${
                            benefit.active ? "" : "opacity-50"
                          }`}
                        >
                          <p className="font-semibold">{benefit.name}</p>
                          <p className="mt-1 text-base-content/60">Stock: {benefit.stock}</p>
                          <p className="text-base-content/60">Costo: {benefit.cost} pts</p>
                          {!benefit.active && <p className="mt-1 font-semibold text-warning">Inactivo</p>}
                          <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              className="link text-info"
                              onClick={() => openBenefitForm(level, benefit)}
                            >
                              Reponer stock
                            </button>
                            <button
                              type="button"
                              className="link flex items-center gap-1 text-error"
                              onClick={() => handleToggleActive(benefit)}
                            >
                              <TrashIcon className="size-3" /> {benefit.active ? "Desactivar" : "Reactivar"}
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
            <h3 className="text-lg font-bold">{editingBenefit ? "Reponer stock" : "Nuevo beneficio"}</h3>
            <p className="text-xs text-base-content/60">
              {BENEFIT_LEVELS.find(l => l.level === benefitForm.level)?.title}
            </p>

            {editingBenefit ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg bg-base-200 p-3 text-xs">
                  <p className="font-semibold">{editingBenefit.name}</p>
                  <p className="mt-1 text-base-content/60">Costo: {editingBenefit.cost} pts</p>
                  <p className="text-base-content/60">Stock actual: {editingBenefit.stock}</p>
                </div>
                <p className="text-xs text-base-content/50">
                  El nombre, nivel y costo de un beneficio ya publicado no se pueden editar on-chain — solo podés
                  agregar stock o desactivarlo/reactivarlo desde la tarjeta.
                </p>
                <div>
                  <label className="label text-xs font-semibold">Agregar stock</label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full"
                    value={restockAmount}
                    onChange={e => setRestockAmount(e.target.value)}
                    placeholder="ej. 10"
                  />
                </div>
              </div>
            ) : (
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
                  <label className="label text-xs font-semibold">Stock inicial</label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full"
                    value={benefitStock}
                    onChange={e => setBenefitStock(e.target.value)}
                    placeholder="ej. 20"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={closeBenefitForm}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={handleSaveBenefit}
                disabled={benefitsHook.isPending}
              >
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
