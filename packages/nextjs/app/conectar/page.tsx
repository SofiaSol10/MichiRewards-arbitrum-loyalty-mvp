"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowLeftIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { MichiBrand, MichiShell } from "~~/components/MichiBrand";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useWalletStatus } from "~~/hooks/michi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type Rol = "comerciante" | "consumidor";

// `useSearchParams()` obliga a envolver en Suspense para el build de
// producción de Next.js (prerenderizado estático) — en `next dev` no hace
// falta, por eso no se veía localmente.
const ConnectWalletContent = () => {
  const searchParams = useSearchParams();
  const rolParam = searchParams.get("rol");
  // Sin `rol` explícito (llegado desde "Iniciar Sesión" en vez del selector de
  // rol) => `undefined`, y más abajo se autodetecta el rol según el contrato.
  const rol: Rol | undefined =
    rolParam === "consumidor" ? "consumidor" : rolParam === "comerciante" ? "comerciante" : undefined;
  const router = useRouter();
  // Misma condición que `useRequireWallet` usa para las páginas protegidas
  // (Privy autenticado + wagmi sincronizado). Si acá se navegara solo con el
  // `isConnected` de wagmi, esta página podía redirigir "hacia adelante" un
  // instante antes de que la página de destino estuviera de acuerdo, y esa
  // rebotaba de vuelta — un loop de redirecciones entre las dos rutas.
  const walletStatus = useWalletStatus();
  const { address: connectedAddress } = useAccount();

  const { data: isMerchant, isFetched: isMerchantFetched } = useScaffoldReadContract({
    contractName: "MichiPoints",
    functionName: "merchants",
    args: [connectedAddress],
  });

  useEffect(() => {
    if (walletStatus !== "ready" || !connectedAddress) return;

    if (rol === "consumidor") {
      router.push("/consumidor");
      return;
    }

    if (rol === "comerciante") {
      if (isMerchantFetched) router.push(isMerchant ? "/comerciante" : "/aviso");
      return;
    }

    // Sin rol explícito: autodetecta directo a la vista que corresponde.
    if (isMerchantFetched) {
      router.push(isMerchant ? "/comerciante" : "/consumidor");
    }
  }, [walletStatus, connectedAddress, rol, isMerchant, isMerchantFetched, router]);

  return (
    <MichiShell>
      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-base-content/60 hover:text-base-content"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Volver
      </Link>

      <MichiBrand />

      <section aria-labelledby="wallet-title" className="mt-6 rounded-xl bg-base-200 p-4 sm:p-5">
        <h2 id="wallet-title" className="text-sm font-semibold">
          {rol ? `Inicia sesión como ${rol}` : "Inicia sesión para continuar"}
        </h2>

        <div className="mt-3 flex justify-center">
          {walletStatus !== "unauthenticated" ? (
            <p className="text-sm text-base-content/70">Verificando tu cuenta…</p>
          ) : (
            <RainbowKitCustomConnectButton />
          )}
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs text-base-content/60">
          <EnvelopeIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Ingresa con tu correo — te enviamos un código de verificación, sin contraseñas.</span>
        </p>
      </section>
    </MichiShell>
  );
};

const ConnectWallet: NextPage = () => (
  <Suspense
    fallback={
      <MichiShell>
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-base-content/60 hover:text-base-content"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Volver
        </Link>

        <MichiBrand />
      </MichiShell>
    }
  >
    <ConnectWalletContent />
  </Suspense>
);

export default ConnectWallet;
