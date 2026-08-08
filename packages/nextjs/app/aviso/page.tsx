"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowLeftEndOnRectangleIcon, ClockIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { MichiShell } from "~~/components/MichiBrand";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const MerchantNotice: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  // Se llega acá con la sesión de Privy de la última cuenta usada (por ej. si
  // ya se había probado el rol consumidor) — sin esto no hay forma de volver
  // a `/conectar` y elegir correo/wallet de nuevo, es un callejón sin salida.
  const { logout } = usePrivy();

  const handleSwitchAccount = async () => {
    await logout();
    router.push("/conectar?rol=comerciante");
  };

  const contactHref = `mailto:hola@michirewards.com?subject=${encodeURIComponent(
    "Solicitud de comercio - Michi Rewards",
  )}&body=${encodeURIComponent(`Hola, quiero registrar mi comercio con la wallet: ${connectedAddress ?? ""}`)}`;

  return (
    <MichiShell>
      <div className="text-center">
        <span
          aria-hidden="true"
          className="inline-grid size-14 place-items-center rounded-full bg-base-200 text-base-content/70"
        >
          <ClockIcon className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-primary">Un último paso para tu comercio</h1>
        <p className="mt-3 text-sm text-base-content/70">
          Ya elegiste el rol de comercio. Antes de habilitar tu panel, el equipo de Michi Rewards autoriza cada wallet
          manualmente — es un paso único de seguridad. Escribinos con la dirección de abajo y te confirmamos en breve.
        </p>

        {connectedAddress && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-base-200 px-3 py-2 text-sm">
            <span className="text-base-content/60">Tu wallet:</span>
            <Address address={connectedAddress} chain={targetNetwork} disableAddressLink size="sm" />
          </div>
        )}

        <a href={contactHref} className="btn btn-primary mt-6 gap-2">
          <EnvelopeIcon className="size-4" aria-hidden="true" />
          Enviar solicitud por correo
        </a>

        <button type="button" className="btn btn-outline btn-primary mt-3 gap-2" onClick={handleSwitchAccount}>
          <ArrowLeftEndOnRectangleIcon className="size-4" aria-hidden="true" />
          Cerrar sesión y probar con otra cuenta
        </button>

        <p className="mt-4 text-sm">
          <Link href="/" className="link text-base-content/60">
            Volver al inicio
          </Link>
        </p>
      </div>
    </MichiShell>
  );
};

export default MerchantNotice;
