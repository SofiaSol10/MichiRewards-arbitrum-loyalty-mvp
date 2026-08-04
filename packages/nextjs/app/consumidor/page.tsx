"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { MichiBrand, MichiShell } from "~~/components/MichiBrand";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const ConsumerDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  const { data: balance } = useScaffoldReadContract({
    contractName: "MichiCoin",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  return (
    <MichiShell>
      <MichiBrand subtitle="Tus MichiCoins, en un solo lugar." />

      <section className="mt-6 rounded-xl bg-base-200 p-4 text-center sm:p-5">
        {isConnected ? (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">Tu saldo</h2>
            <p className="mt-2 flex items-center justify-center gap-2 text-4xl font-bold text-primary">
              <SparklesIcon className="size-7" aria-hidden="true" />
              {balance !== undefined ? Number(formatEther(balance)).toLocaleString("es-PE") : "0"}
            </p>
            <p className="mt-1 text-sm text-base-content/70">MichiCoin(s)</p>
            <p className="mt-4 text-xs text-base-content/50">
              Pronto vas a poder usar tus MichiCoins directamente desde acá.
            </p>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-base-content/70">Conecta tu wallet para ver tu saldo de MichiCoins.</p>
            <div className="flex justify-center">
              <RainbowKitCustomConnectButton />
            </div>
          </>
        )}
      </section>
    </MichiShell>
  );
};

export default ConsumerDashboard;
