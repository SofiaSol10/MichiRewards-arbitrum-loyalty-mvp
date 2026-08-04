import Link from "next/link";
import type { NextPage } from "next";
import { EnvelopeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { MichiShell } from "~~/components/MichiBrand";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Aviso para comercios — Michi Rewards",
  description:
    "Tu wallet aún no está registrada como comercio en Michi Rewards. Contáctanos para obtener la autorización.",
});

const MerchantNotice: NextPage = () => {
  return (
    <MichiShell>
      <div className="text-center">
        <span
          aria-hidden="true"
          className="inline-grid size-14 place-items-center rounded-full bg-base-200 text-base-content/70"
        >
          <ExclamationTriangleIcon className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-primary">Aviso para comercios</h1>
        <p className="mt-3 text-sm text-base-content/70">
          Tu billetera conectada no está registrada como comercio en este contrato. Se requiere la autorización de Michi
          Rewards.
        </p>

        <a href="mailto:hola@michirewards.com" className="btn btn-primary mt-6 gap-2">
          <EnvelopeIcon className="size-4" aria-hidden="true" />
          Contactar
        </a>

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
