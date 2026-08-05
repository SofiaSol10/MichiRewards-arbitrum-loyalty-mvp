"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { MichiBrand, MichiShell } from "~~/components/MichiBrand";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type Rol = "comerciante" | "consumidor";

const ConnectWallet: NextPage = () => {
  const searchParams = useSearchParams();
  const rol: Rol = searchParams.get("rol") === "consumidor" ? "consumidor" : "comerciante";
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();

  const { data: isMerchant, isFetched: isMerchantFetched } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchants",
    args: [connectedAddress],
  });

  useEffect(() => {
    if (!isConnected || !connectedAddress) return;

    if (rol === "consumidor") {
      router.push("/consumidor");
      return;
    }

    if (isMerchantFetched) {
      router.push(isMerchant ? "/comerciante" : "/aviso");
    }
  }, [isConnected, connectedAddress, rol, isMerchant, isMerchantFetched, router]);

  return (
    <MichiShell>
      <MichiBrand />

      <section aria-labelledby="wallet-title" className="mt-6 rounded-xl bg-base-200 p-4 sm:p-5">
        <h2 id="wallet-title" className="text-sm font-semibold">
          Conecta tu wallet como {rol}
        </h2>

        <div className="mt-3 flex justify-center">
          {isConnected ? (
            <p className="text-sm text-base-content/70">Verificando tu cuenta…</p>
          ) : (
            <RainbowKitCustomConnectButton />
          )}
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs text-base-content/60">
          <DevicePhoneMobileIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            No detectamos una wallet. Abre esta página desde el navegador interno de MetaMask en tu celular para
            continuar.
          </span>
        </p>
      </section>
    </MichiShell>
  );
};

export default ConnectWallet;
