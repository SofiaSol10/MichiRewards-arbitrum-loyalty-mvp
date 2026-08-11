"use client";

import { useState } from "react";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useTargetNetwork,
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Admin: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [activeTab, setActiveTab] = useState<"account" | "merchant" | "admin" | "events">("account");

  // Form states
  const [searchAddress, setSearchAddress] = useState<string>("");

  const [mintCustomerAddress, setMintCustomerAddress] = useState<string>("");
  const [mintPurchaseAmount, setMintPurchaseAmount] = useState<string>("");

  const [ticketCode, setTicketCode] = useState<string>("");

  const [regMerchantAddress, setRegMerchantAddress] = useState<string>("");
  const [removeMerchantAddress, setRemoveMerchantAddress] = useState<string>("");
  const [newRewardRate, setNewRewardRate] = useState<string>("");

  // Contract Reads
  const { data: rewardRate } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "rewardRate",
  });

  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "owner",
  });

  const { data: connectedUserBalance, refetch: refetchConnectedBalance } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: isConnectedUserMerchant, refetch: refetchIsMerchant } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchants",
    args: [connectedAddress],
  });

  // Query custom address
  const { data: searchedBalance } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "balanceOf",
    args: [searchAddress],
  });

  const { data: isSearchedMerchant } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchants",
    args: [searchAddress],
  });

  // Contract Writes
  const { writeContractAsync: writeMichiPoints, isPending } = useScaffoldWriteContract({
    contractName: "MichiPoints",
  });

  // Events
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { data: purchaseEvents, isLoading: isPurchaseLoading } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "PurchaseRegistered",
    watch: true,
    fromBlock: 0n,
  });

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { data: validatedEvents, isLoading: isValidatedLoading } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "TicketValidated",
    watch: true,
    fromBlock: 0n,
  });

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { data: registeredEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "MerchantRegistered",
    watch: true,
    fromBlock: 0n,
  });

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { data: removedEvents } = useScaffoldEventHistory({
    contractName: "MichiPoints",
    eventName: "MerchantRemoved",
    watch: true,
    fromBlock: 0n,
  });

  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // Handlers
  const handleMintReward = async () => {
    if (!mintCustomerAddress || !mintPurchaseAmount) {
      notification.error("Por favor ingresa la dirección del cliente y el monto de compra.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "registerPurchase",
        args: [mintCustomerAddress, BigInt(mintPurchaseAmount)],
      });
      notification.success("Recompensa acreditada correctamente");
      setMintPurchaseAmount("");
      refetchConnectedBalance();
    } catch (e: any) {
      console.error("Error al registrar la compra:", e);
    }
  };

  const handleValidateTicket = async () => {
    if (!ticketCode.trim()) {
      notification.error("Por favor ingresa el código del ticket a validar.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "validateTicket",
        args: [ticketCode.trim()],
      });
      notification.success("Ticket validado exitosamente");
      setTicketCode("");
    } catch (e: any) {
      console.error("Error al validar el ticket:", e);
    }
  };

  const handleRegisterMerchant = async () => {
    if (!regMerchantAddress) {
      notification.error("Por favor ingresa la dirección del comercio.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "registerMerchant",
        args: [regMerchantAddress],
      });
      notification.success("Comercio registrado con éxito");
      setRegMerchantAddress("");
      refetchIsMerchant();
    } catch (e: any) {
      console.error("Error al registrar comercio:", e);
    }
  };

  const handleRemoveMerchant = async () => {
    if (!removeMerchantAddress) {
      notification.error("Por favor ingresa la dirección del comercio a remover.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "removeMerchant",
        args: [removeMerchantAddress],
      });
      notification.success("Comercio removido con éxito");
      setRemoveMerchantAddress("");
      refetchIsMerchant();
    } catch (e: any) {
      console.error("Error al remover comercio:", e);
    }
  };

  const handleUpdateRewardRate = async () => {
    if (!newRewardRate) {
      notification.error("Por favor ingresa la nueva tasa de recompensa.");
      return;
    }
    try {
      await writeMichiPoints({
        functionName: "updateRewardRate",
        args: [BigInt(newRewardRate)],
      });
      notification.success("Tasa de recompensa actualizada");
      setNewRewardRate("");
    } catch (e: any) {
      console.error("Error al actualizar la tasa de recompensa:", e);
    }
  };

  const calculatedReward = mintPurchaseAmount && rewardRate ? BigInt(mintPurchaseAmount) * rewardRate : 0n;

  return (
    <div className="flex flex-col items-center shrink-0 w-full px-4 sm:px-8 py-8 gap-8">
      {/* Header Banner */}
      <div className="card w-full max-w-5xl bg-gradient-to-r from-primary via-secondary to-accent text-primary-content shadow-2xl p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-base-100/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              <SparklesIcon className="w-4 h-4" /> Smart Contract Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">MichiPoints</h1>
            <p className="text-sm opacity-90 max-w-xl">
              Sistema descentralizado de fidelización y recompensas para comercios y clientes.
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-3">
            <div className="bg-base-100/20 backdrop-blur-md p-4 rounded-2xl text-center min-w-[130px]">
              <span className="block text-xs uppercase opacity-80 font-bold">Tasa Recompensa</span>
              <span className="text-2xl font-black">{rewardRate ? rewardRate.toString() : "0"} x1</span>
            </div>
          </div>
        </div>

        {/* User Identity & Roles Bar */}
        <div className="mt-6 pt-6 border-t border-primary-content/20 flex flex-wrap justify-between items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Mi Billetera:</span>
            {connectedAddress ? (
              <Address address={connectedAddress} chain={targetNetwork} />
            ) : (
              <span className="italic opacity-80">Desconectado</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Mi Balance:</span>
            <span className="font-mono font-bold text-base bg-base-100/30 px-3 py-1 rounded-lg">
              {connectedUserBalance !== undefined ? connectedUserBalance.toString() : "0"} MCHI
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <span className="badge badge-warning gap-1 font-bold py-3 px-3 shadow-sm">
                <ShieldCheckIcon className="w-4 h-4" /> Owner
              </span>
            )}
            {isConnectedUserMerchant && (
              <span className="badge badge-success gap-1 font-bold py-3 px-3 shadow-sm">
                <BuildingStorefrontIcon className="w-4 h-4" /> Comercio Autorizado
              </span>
            )}
            {!isOwner && !isConnectedUserMerchant && (
              <span className="badge badge-ghost gap-1 font-medium py-3 px-3">
                <UserIcon className="w-4 h-4" /> Cliente / Usuario
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-5xl">
        <div className="tabs tabs-boxed justify-center bg-base-200 p-2 rounded-2xl gap-2 shadow-inner">
          <button
            className={`tab tab-lg gap-2 rounded-xl transition-all ${
              activeTab === "account" ? "tab-active bg-primary text-primary-content font-bold shadow-md" : ""
            }`}
            onClick={() => setActiveTab("account")}
          >
            <UserIcon className="w-5 h-5" /> Mi Cuenta & Transferir
          </button>
          <button
            className={`tab tab-lg gap-2 rounded-xl transition-all ${
              activeTab === "merchant" ? "tab-active bg-primary text-primary-content font-bold shadow-md" : ""
            }`}
            onClick={() => setActiveTab("merchant")}
          >
            <BuildingStorefrontIcon className="w-5 h-5" /> Panel de Comercio
          </button>
          <button
            className={`tab tab-lg gap-2 rounded-xl transition-all ${
              activeTab === "admin" ? "tab-active bg-primary text-primary-content font-bold shadow-md" : ""
            }`}
            onClick={() => setActiveTab("admin")}
          >
            <Cog6ToothIcon className="w-5 h-5" /> Admin / Owner
          </button>
          <button
            className={`tab tab-lg gap-2 rounded-xl transition-all ${
              activeTab === "events" ? "tab-active bg-primary text-primary-content font-bold shadow-md" : ""
            }`}
            onClick={() => setActiveTab("events")}
          >
            <ClockIcon className="w-5 h-5" /> Eventos en Vivo
          </button>
        </div>
      </div>

      {/* Tab 1: Mi Cuenta */}
      {activeTab === "account" && (
        <div className="w-full max-w-5xl">
          {/* Search Balance / Status Card */}
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 space-y-4 max-w-xl mx-auto">
            <h2 className="card-title text-xl font-bold flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-secondary" /> Consulta de Usuario / Comercio
            </h2>
            <p className="text-xs text-base-content/70">
              Inspecciona el saldo de MichiPoints y el estado de comercio autorizado de cualquier dirección.
            </p>
            <div className="space-y-3">
              <div>
                <label className="label text-xs font-semibold">Dirección a Consultar</label>
                <AddressInput value={searchAddress} onChange={setSearchAddress} placeholder="Ingresa dirección 0x..." />
              </div>
              {searchAddress ? (
                <div className="bg-base-200 p-4 rounded-2xl space-y-2 mt-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">Saldo MichiPoints:</span>
                    <span className="font-mono font-bold text-primary">
                      {searchedBalance !== undefined ? searchedBalance.toString() : "0"} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">¿Es Comercio Autorizado?:</span>
                    {isSearchedMerchant ? (
                      <span className="badge badge-success gap-1 text-xs font-bold">
                        <CheckCircleIcon className="w-4 h-4" /> Sí
                      </span>
                    ) : (
                      <span className="badge badge-ghost gap-1 text-xs">
                        <XCircleIcon className="w-4 h-4" /> No
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-base-content/50 italic border border-dashed rounded-2xl">
                  Ingresa una dirección para ver los detalles
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Panel de Comercio */}
      {activeTab === "merchant" && (
        <div className="w-full max-w-5xl space-y-6">
          {!isConnectedUserMerchant && (
            <div className="alert alert-warning shadow-lg rounded-2xl text-xs sm:text-sm">
              <BuildingStorefrontIcon className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold">Aviso para Comercios</h3>
                <div className="text-xs">
                  Tu billetera conectada no está registrada como comercio en este contrato. Las llamadas a{" "}
                  <code>registerPurchase</code> y <code>validateTicket</code> requieren autorización del Owner.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mint Reward Card */}
            <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 space-y-4">
              <h2 className="card-title text-xl font-bold flex items-center gap-2 text-success">
                <PlusCircleIcon className="w-6 h-6" /> Otorgar Recompensa (Mint)
              </h2>
              <p className="text-xs text-base-content/70">
                Emitir tokens MCHI al cliente al realizar una compra. Recompensa = Monto Compra × Tasa.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs font-semibold">Dirección Cliente</label>
                  <AddressInput value={mintCustomerAddress} onChange={setMintCustomerAddress} placeholder="0x..." />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Monto de Compra (Unidades)</label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full"
                    value={mintPurchaseAmount}
                    onChange={e => setMintPurchaseAmount(e.target.value)}
                    placeholder="ej. 100"
                  />
                </div>

                <div className="bg-base-200 p-3 rounded-xl flex justify-between items-center text-xs font-semibold">
                  <span>Puntos a Otorgar:</span>
                  <span className="text-base font-bold text-success">{calculatedReward.toString()} pts</span>
                </div>

                <button
                  className="btn btn-success text-white w-full gap-2 mt-2"
                  onClick={handleMintReward}
                  disabled={isPending}
                >
                  <SparklesIcon className="w-5 h-5" /> Acreditar Recompensa
                </button>
              </div>
            </div>

            {/* Validate Ticket Card */}
            <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 space-y-4">
              <h2 className="card-title text-xl font-bold flex items-center gap-2 text-error">
                <CheckBadgeIcon className="w-6 h-6" /> Validar Ticket de Canje
              </h2>
              <p className="text-xs text-base-content/70">
                Ingresa el código de ticket que el cliente muestra en caja para completar un canje de beneficio.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs font-semibold">Código del Ticket</label>
                  <input
                    type="text"
                    className="input input-bordered w-full uppercase"
                    value={ticketCode}
                    onChange={e => setTicketCode(e.target.value)}
                    placeholder="MCH-XXXX-X"
                  />
                </div>

                <button
                  className="btn btn-error text-white w-full gap-2 mt-6"
                  onClick={handleValidateTicket}
                  disabled={isPending}
                >
                  <CheckBadgeIcon className="w-5 h-5" /> Validar Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Admin / Owner Panel */}
      {activeTab === "admin" && (
        <div className="w-full max-w-5xl space-y-6">
          {!isOwner && (
            <div className="alert alert-error text-white shadow-lg rounded-2xl text-xs sm:text-sm">
              <ShieldCheckIcon className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold">Acceso de Administrador Recomendado</h3>
                <div className="text-xs">
                  Tu billetera conectada no es el <code>owner</code> de <code>MichiPoints</code>. Las siguientes
                  funciones sólo funcionarán si utilizas la cuenta Owner.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Register Merchant */}
            <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 space-y-4">
              <h3 className="card-title text-base font-bold flex items-center gap-2">
                <BuildingStorefrontIcon className="w-5 h-5 text-primary" /> Autorizar Comercio
              </h3>
              <div className="space-y-3">
                <AddressInput
                  value={regMerchantAddress}
                  onChange={setRegMerchantAddress}
                  placeholder="Dirección del comercio 0x..."
                />
                <button
                  className="btn btn-primary btn-sm w-full gap-1"
                  onClick={handleRegisterMerchant}
                  disabled={isPending}
                >
                  <PlusCircleIcon className="w-4 h-4" /> Registrar Comercio
                </button>
              </div>
            </div>

            {/* Remove Merchant */}
            <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 space-y-4">
              <h3 className="card-title text-base font-bold flex items-center gap-2 text-error">
                <TrashIcon className="w-5 h-5" /> Remover Comercio
              </h3>
              <div className="space-y-3">
                <AddressInput
                  value={removeMerchantAddress}
                  onChange={setRemoveMerchantAddress}
                  placeholder="Dirección a revocar 0x..."
                />
                <button
                  className="btn btn-error btn-sm text-white w-full gap-1"
                  onClick={handleRemoveMerchant}
                  disabled={isPending}
                >
                  <TrashIcon className="w-4 h-4" /> Revocar Permisos
                </button>
              </div>
            </div>

            {/* Update Reward Rate */}
            <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 space-y-4">
              <h3 className="card-title text-base font-bold flex items-center gap-2 text-warning">
                <Cog6ToothIcon className="w-5 h-5" /> Cambiar Tasa (Rate)
              </h3>
              <div className="space-y-3">
                <input
                  type="number"
                  min="0"
                  className="input input-bordered w-full"
                  value={newRewardRate}
                  onChange={e => setNewRewardRate(e.target.value)}
                  placeholder={`Actual: ${rewardRate?.toString() ?? "1"}`}
                />
                <button
                  className="btn btn-warning btn-sm w-full gap-1"
                  onClick={handleUpdateRewardRate}
                  disabled={isPending}
                >
                  <Cog6ToothIcon className="w-4 h-4" /> Actualizar Tasa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Events History */}
      {activeTab === "events" && (
        <div className="w-full max-w-5xl space-y-6">
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6">
            <h2 className="card-title text-xl font-bold mb-4 flex items-center gap-2">
              <ClockIcon className="w-6 h-6 text-primary" /> Historial de Eventos del Contrato
            </h2>

            <div className="space-y-6">
              {/* Purchase Events */}
              <div>
                <h3 className="font-bold text-sm text-success mb-2 flex items-center gap-1">
                  <SparklesIcon className="w-4 h-4" /> Compras Registradas (PurchaseRegistered)
                </h3>
                {isPurchaseLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : purchaseEvents && purchaseEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-xs w-full bg-base-200 rounded-xl">
                      <thead>
                        <tr>
                          <th>Bloque</th>
                          <th>Comercio</th>
                          <th>Cliente</th>
                          <th>Monto Compra</th>
                          <th>Puntos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseEvents.map((evt, idx) => (
                          <tr key={idx}>
                            <td className="font-mono">{evt.blockNumber?.toString()}</td>
                            <td>
                              <Address address={evt.args.merchant} />
                            </td>
                            <td>
                              <Address address={evt.args.user} />
                            </td>
                            <td className="font-mono">{evt.args.amount?.toString()}</td>
                            <td className="font-mono font-bold text-success">{evt.args.points?.toString()} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs opacity-60 italic">No hay compras registradas aún.</p>
                )}
              </div>

              {/* Ticket Validated Events */}
              <div>
                <h3 className="font-bold text-sm text-error mb-2 flex items-center gap-1">
                  <CheckBadgeIcon className="w-4 h-4" /> Canjes Validados (TicketValidated)
                </h3>
                {isValidatedLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : validatedEvents && validatedEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-xs w-full bg-base-200 rounded-xl">
                      <thead>
                        <tr>
                          <th>Bloque</th>
                          <th>Comercio</th>
                          <th>Cliente</th>
                          <th>Ticket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedEvents.map((evt, idx) => (
                          <tr key={idx}>
                            <td className="font-mono">{evt.blockNumber?.toString()}</td>
                            <td>
                              <Address address={evt.args.merchant} />
                            </td>
                            <td>
                              <Address address={evt.args.customer} />
                            </td>
                            <td className="font-mono text-xs">{evt.args.ticketId?.slice(0, 10)}…</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs opacity-60 italic">No hay canjes validados aún.</p>
                )}
              </div>

              {/* Merchant Registration Events */}
              <div>
                <h3 className="font-bold text-sm text-info mb-2 flex items-center gap-1">
                  <BuildingStorefrontIcon className="w-4 h-4" /> Cambios de Comercios Autorizados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold opacity-70 mb-1">Registrados</h4>
                    {registeredEvents && registeredEvents.length > 0 ? (
                      <ul className="space-y-1">
                        {registeredEvents.map((evt, idx) => (
                          <li
                            key={idx}
                            className="bg-base-200 p-2 rounded-lg text-xs flex items-center justify-between"
                          >
                            <Address address={evt.args.merchant} />
                            <span className="font-mono opacity-50">Blk: {evt.blockNumber?.toString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs opacity-50 italic">Sin registros</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold opacity-70 mb-1">Removidos</h4>
                    {removedEvents && removedEvents.length > 0 ? (
                      <ul className="space-y-1">
                        {removedEvents.map((evt, idx) => (
                          <li
                            key={idx}
                            className="bg-base-200 p-2 rounded-lg text-xs flex items-center justify-between"
                          >
                            <Address address={evt.args.merchant} />
                            <span className="font-mono opacity-50">Blk: {evt.blockNumber?.toString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs opacity-50 italic">Sin remociones</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
